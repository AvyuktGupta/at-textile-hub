import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, me, register } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many sign-in attempts. Please try again in a few minutes." },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many accounts created from this network. Please try again later." },
});

router.post("/login", loginLimiter, login);
router.post("/register", registerLimiter, register);
router.get("/me", protect, me);

export default router;
