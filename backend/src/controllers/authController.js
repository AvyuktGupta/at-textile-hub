import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { signToken } from "../utils/token.js";

export async function login(req, res) {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !password) {
    throw ApiError.badRequest("Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized("Incorrect email or password");
  }

  res.json({ success: true, data: { token: signToken(user), user } });
}

export async function me(req, res) {
  res.json({ success: true, data: { user: req.user } });
}
