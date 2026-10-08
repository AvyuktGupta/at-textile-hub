import path from "node:path";
import { fileURLToPath } from "node:url";
import "./env.js";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const UPLOADS_URL_PREFIX = "/uploads";
export const uploadsDir = path.resolve(backendRoot, process.env.UPLOAD_DIR || "uploads");
