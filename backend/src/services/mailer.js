import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";
import env from "../config/env.js";

const PREVIEW_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../mail-previews");

export const isMailConfigured = () => Boolean(env.smtp.host);

let transporter;
function getTransporter() {
  transporter ??= nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

const fromAddress = () => env.smtp.from || `${env.storeName} <${env.smtp.user || "no-reply@localhost"}>`;

async function writePreview(message) {
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  const name = `${new Date().toISOString().replace(/[:.]/g, "-")}-${message.subject.replace(/[^a-z0-9]+/gi, "-").slice(0, 60)}.html`;
  const file = path.join(PREVIEW_DIR, name);
  const replyTo = typeof message.replyTo === "object" ? message.replyTo?.address : message.replyTo;
  const meta = `To: ${message.to} | Reply-To: ${replyTo ?? ""} | Subject: ${message.subject}`;
  const header = `<!-- ${meta.replace(/--/g, "- -")} -->\n`;
  await fs.writeFile(file, header + message.html);
  return file;
}

/**
 * Sends one email. Without SMTP configured, development writes an HTML preview to mail-previews/
 * and production logs a warning; both report "skipped" so the order is still saved.
 * Resolves to `{ status: "sent" | "skipped", detail? }`; throws if the SMTP server rejects it.
 */
export async function sendMail({ to, subject, html, text, replyTo }) {
  if (!isMailConfigured()) {
    if (env.isProduction) {
      console.warn(`[mail] SMTP is not configured; "${subject}" to ${to} was not sent`);
      return { status: "skipped", detail: "SMTP is not configured" };
    }
    const file = await writePreview({ to, subject, html, replyTo });
    console.info(`[mail] SMTP not configured; preview saved to ${path.relative(process.cwd(), file)}`);
    return { status: "skipped", detail: "SMTP is not configured (preview saved)" };
  }

  await getTransporter().sendMail({ from: fromAddress(), to, subject, html, text, replyTo });
  return { status: "sent" };
}

export async function verifyMailTransport() {
  if (!isMailConfigured()) return false;
  await getTransporter().verify();
  return true;
}
