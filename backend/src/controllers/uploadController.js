import { UPLOADS_URL_PREFIX } from "../config/paths.js";
import ApiError from "../utils/ApiError.js";

export function uploadImagesHandler(req, res) {
  if (!req.files?.length) throw ApiError.badRequest("Select at least one image to upload");

  res.status(201).json({
    success: true,
    data: req.files.map((file) => ({
      url: `${UPLOADS_URL_PREFIX}/${file.filename}`,
      size: file.size,
      originalName: file.originalname,
    })),
  });
}
