import { destroyCloudinaryImage, isCloudinaryEnabled, uploadImageBuffer } from "../config/cloudinary.js";
import { UPLOADS_URL_PREFIX } from "../config/paths.js";
import ApiError from "../utils/ApiError.js";

export async function uploadImagesHandler(req, res) {
  if (!req.files?.length) throw ApiError.badRequest("Select at least one image to upload");

  if (!isCloudinaryEnabled()) {
    res.status(201).json({
      success: true,
      data: req.files.map((file) => ({
        url: `${UPLOADS_URL_PREFIX}/${file.filename}`,
        size: file.size,
        originalName: file.originalname,
      })),
    });
    return;
  }

  const stored = [];
  try {
    for (const file of req.files) {
      const result = await uploadImageBuffer(file.buffer);
      stored.push({
        url: result.secure_url,
        size: file.size,
        originalName: file.originalname,
      });
    }
  } catch (err) {
    console.error("[uploads] Cloudinary upload failed:", err?.message || err);
    await Promise.all(stored.map((file) => destroyCloudinaryImage(file.url).catch(() => {})));
    throw new ApiError(502, "Could not store the image. Check the Cloudinary credentials and try again.");
  }

  res.status(201).json({ success: true, data: stored });
}
