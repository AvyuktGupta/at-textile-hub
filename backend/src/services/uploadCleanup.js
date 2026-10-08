import fs from "node:fs/promises";
import path from "node:path";
import { UPLOADS_URL_PREFIX, uploadsDir } from "../config/paths.js";
import Product from "../models/Product.js";
import SiteSettings from "../models/SiteSettings.js";

function toLocalPath(url) {
  if (typeof url !== "string" || !url.startsWith(`${UPLOADS_URL_PREFIX}/`)) return null;
  const filePath = path.resolve(uploadsDir, path.basename(url));
  return filePath.startsWith(uploadsDir) ? filePath : null;
}

async function isReferenced(url) {
  const [inProducts, inSettings] = await Promise.all([
    Product.exists({ "images.url": url }),
    SiteSettings.exists({ headerImageUrl: url }),
  ]);
  return Boolean(inProducts || inSettings);
}

/**
 * Deletes locally uploaded files that are no longer used by any product or the site settings.
 * External URLs are ignored. Failures are logged and never thrown, since the DB write already succeeded.
 */
export async function removeUnusedUploads(urls = []) {
  const candidates = [...new Set(urls)].filter((url) => toLocalPath(url));
  await Promise.all(
    candidates.map(async (url) => {
      try {
        if (await isReferenced(url)) return;
        await fs.unlink(toLocalPath(url));
      } catch (err) {
        if (err.code !== "ENOENT") console.warn(`[uploads] Could not remove ${url}:`, err.message);
      }
    })
  );
}
