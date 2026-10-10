import { Readable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";
import env from "./env.js";

const FOLDER = "at-textile";

export function isCloudinaryEnabled() {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  return Boolean(cloudName && apiKey && apiSecret);
}

function client() {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
  return cloudinary;
}

export function uploadImageBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const stream = client().uploader.upload_stream(
      { folder: FOLDER, resource_type: "image", unique_filename: true, overwrite: false },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error || new Error("Cloudinary did not return an image URL"));
          return;
        }
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

/** public_id for an image this account uploaded into the app folder, or null otherwise. */
export function cloudinaryPublicId(url) {
  if (!isCloudinaryEnabled() || typeof url !== "string") return null;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.hostname !== "res.cloudinary.com") return null;
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts[0] !== env.cloudinary.cloudName || parts[2] !== "upload") return null;

  const afterUpload = parts.slice(3);
  const withoutVersion = /^v\d+$/.test(afterUpload[0] || "") ? afterUpload.slice(1) : afterUpload;
  const publicId = withoutVersion.join("/").replace(/\.[^.]+$/, "");
  return publicId.startsWith(`${FOLDER}/`) ? publicId : null;
}

export async function destroyCloudinaryImage(url) {
  const publicId = cloudinaryPublicId(url);
  if (!publicId) return;
  const result = await client().uploader.destroy(publicId, { resource_type: "image" });
  if (result?.result !== "ok" && result?.result !== "not found") {
    throw new Error(result?.result || "Cloudinary delete failed");
  }
}
