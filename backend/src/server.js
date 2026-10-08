import app from "./app.js";
import env from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { isMailConfigured, verifyMailTransport } from "./services/mailer.js";

async function start() {
  await connectDB();

  const server = app.listen(env.port, () => {
    console.log(`[api] Listening on port ${env.port} (${env.nodeEnv})`);
  });

  if (!isMailConfigured()) {
    console.warn(
      env.isProduction
        ? "[mail] SMTP_HOST is not set: order emails will NOT be sent (orders are still saved)"
        : "[mail] SMTP_HOST is not set: order emails will be saved to mail-previews/ instead of sent"
    );
  } else {
    verifyMailTransport()
      .then(() => console.log(`[mail] SMTP ready (${env.smtp.host}:${env.smtp.port})`))
      .catch((err) => console.error(`[mail] SMTP check failed: ${err.message}`));
  }

  const shutdown = (signal) => {
    console.log(`[api] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

process.on("unhandledRejection", (reason) => {
  console.error("[api] Unhandled rejection:", reason);
});

start().catch((err) => {
  console.error("[api] Failed to start:", err);
  process.exit(1);
});
