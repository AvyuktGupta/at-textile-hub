import { Router } from "express";
import { getRecentlyViewed, recordRecentlyViewed } from "../controllers/accountController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);
router.get("/recently-viewed", getRecentlyViewed);
router.post("/recently-viewed", recordRecentlyViewed);

export default router;
