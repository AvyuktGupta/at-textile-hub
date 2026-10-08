import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createOrder,
  getOrder,
  listOrders,
  resendOrderEmail,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = Router();

const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many orders submitted. Please wait a while or contact us directly." },
});

const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

router.post("/", orderLimiter, protect, createOrder);
router.get("/", requireAdmin, listOrders);
router.get("/:id", requireAdmin, getOrder);
router.patch("/:id", requireAdmin, updateOrderStatus);
router.post("/:id/resend-email", resendLimiter, requireAdmin, resendOrderEmail);

export default router;
