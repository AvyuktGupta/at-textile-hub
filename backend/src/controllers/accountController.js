import mongoose from "mongoose";
import Product from "../models/Product.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { parseBuyerProfile, validatePassword } from "../utils/profile.js";
import { signToken } from "../utils/token.js";
import { CARD_FIELDS } from "./storefrontController.js";

export async function updateProfile(req, res) {
  const profile = parseBuyerProfile(req.body);
  req.user.set(profile);
  await req.user.save();
  res.json({ success: true, data: { user: req.user } });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body ?? {};
  if (typeof currentPassword !== "string" || !currentPassword) {
    throw ApiError.badRequest("Please check the highlighted fields", {
      currentPassword: "Enter your current password",
    });
  }
  validatePassword(newPassword, "newPassword");

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest("Please check the highlighted fields", {
      currentPassword: "Current password is incorrect",
    });
  }

  user.password = newPassword;
  await user.save();
  // Other sessions are now invalid; hand this one a fresh token so the buyer stays signed in.
  res.json({ success: true, data: { token: signToken(user) } });
}

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
