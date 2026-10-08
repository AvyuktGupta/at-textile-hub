import { Router } from "express";
import {
  getAdminSettings,
  getPublicSettings,
  updateSettings,
} from "../controllers/settingsController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", getPublicSettings);
router.get("/admin", requireAdmin, getAdminSettings);
router.put("/", requireAdmin, updateSettings);

export default router;
