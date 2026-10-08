import { Router } from "express";
import { uploadImagesHandler } from "../controllers/uploadController.js";
import { requireAdmin } from "../middleware/auth.js";
import { uploadImages } from "../middleware/upload.js";

const router = Router();

router.post("/", requireAdmin, uploadImages, uploadImagesHandler);

export default router;
