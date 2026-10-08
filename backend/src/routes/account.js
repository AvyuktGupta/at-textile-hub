import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  changePassword,
  getRecentlyViewed,
  recordRecentlyViewed,
  updateProfile,
} from "../controllers/accountController.js";
import { listMyOrders } from "../controllers/orderController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again in a few minutes." },
});

router.use(protect);
router.patch("/profile", updateProfile);
router.put("/password", passwordLimiter, changePassword);
router.get("/orders", listMyOrders);
router.get("/recently-viewed", getRecentlyViewed);
router.post("/recently-viewed", recordRecentlyViewed);

export default router;
