import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  listTags,
  updateProduct,
} from "../controllers/productController.js";
import { optionalAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Public reads; admins additionally see inactive products.
router.get("/", optionalAuth, listProducts);
router.get("/tags", optionalAuth, listTags);
router.get("/:idOrSlug", optionalAuth, getProduct);

router.post("/", requireAdmin, createProduct);
router.patch("/:id", requireAdmin, updateProduct);
router.delete("/:id", requireAdmin, deleteProduct);

export default router;
