import mongoose from "mongoose";
import Product from "../models/Product.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { CARD_FIELDS } from "./storefrontController.js";

export async function getRecentlyViewed(req, res) {
  const ids = req.user.recentlyViewed.map((entry) => entry.product);
  const products = await Product.find({ _id: { $in: ids }, isActive: true }).select(CARD_FIELDS);

  const byId = new Map(products.map((product) => [String(product._id), product]));
  const ordered = ids.map((id) => byId.get(String(id))).filter(Boolean);

  res.json({ success: true, data: ordered });
}

export async function recordRecentlyViewed(req, res) {
  const { productId } = req.body ?? {};
  if (!mongoose.isValidObjectId(productId)) throw ApiError.badRequest("A valid productId is required");

  const exists = await Product.exists({ _id: productId, isActive: true });
  if (!exists) throw ApiError.notFound("Product not found");

  await User.recordView(req.user._id, productId);
  res.status(204).end();
}
