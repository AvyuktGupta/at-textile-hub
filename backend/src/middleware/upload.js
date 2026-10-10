import crypto from "node:crypto";
import fs from "node:fs";
import multer from "multer";
import { isCloudinaryEnabled } from "../config/cloudinary.js";
import { uploadsDir } from "../config/paths.js";
import ApiError from "../utils/ApiError.js";

const MIME_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
};

export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILES = 10;

const storage = isCloudinaryEnabled()
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: uploadsDir,
      filename(_req, file, cb) {
        cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${MIME_EXTENSIONS[file.mimetype]}`);
      },
    });

if (!isCloudinaryEnabled()) fs.mkdirSync(uploadsDir, { recursive: true });

const multerUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, files: MAX_FILES },
  fileFilter(_req, file, cb) {
    if (MIME_EXTENSIONS[file.mimetype]) return cb(null, true);
    return cb(ApiError.badRequest("Only JPG, PNG, WebP, AVIF and GIF images are allowed"));
  },
});

/** Accepts up to MAX_FILES images in the multipart field "images". */
export function uploadImages(req, res, next) {
  multerUpload.array("images", MAX_FILES)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const messages = {
        LIMIT_FILE_SIZE: `Each image must be ${MAX_FILE_SIZE_MB} MB or smaller`,
        LIMIT_FILE_COUNT: `You can upload at most ${MAX_FILES} images at once`,
        LIMIT_UNEXPECTED_FILE: `Upload images using the "images" field (max ${MAX_FILES})`,
      };
      return next(ApiError.badRequest(messages[err.code] || err.message));
    }
    return next(err);
  });
}
