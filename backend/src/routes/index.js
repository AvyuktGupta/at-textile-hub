import { Router } from "express";
import mongoose from "mongoose";
import { quote } from "../controllers/orderController.js";
import { getHome } from "../controllers/storefrontController.js";
import accountRoutes from "./account.js";
import authRoutes from "./auth.js";
import orderRoutes from "./orders.js";
import productRoutes from "./products.js";
import settingsRoutes from "./settings.js";
import uploadRoutes from "./uploads.js";

const router = Router();

router.get("/health", (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({
    success: dbReady,
    status: dbReady ? "ok" : "degraded",
    database: dbReady ? "connected" : "disconnected",
    uptime: Math.round(process.uptime()),
  });
});

router.get("/storefront/home", getHome);
router.post("/cart/quote", quote);
router.use("/auth", authRoutes);
router.use("/me", accountRoutes);
router.use("/orders", orderRoutes);
router.use("/products", productRoutes);
router.use("/settings", settingsRoutes);
router.use("/uploads", uploadRoutes);

export default router;
