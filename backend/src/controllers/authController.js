import User, { ROLES } from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { parseBuyerProfile, validatePassword } from "../utils/profile.js";
import { signToken } from "../utils/token.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

/** Self-service trade account. Always creates a buyer; roles can only be raised by an admin. */
export async function register(req, res) {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = req.body?.password;

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw ApiError.badRequest("Please check the highlighted fields", { email: "Please provide a valid email address" });
  }
  validatePassword(password);
  const profile = parseBuyerProfile(req.body);

  if (await User.exists({ email })) {
    throw ApiError.conflict("An account with this email already exists", {
      email: "An account with this email already exists. Try signing in instead.",
    });
  }

  const user = await User.create({ ...profile, email, password, role: ROLES.USER });
  res.status(201).json({ success: true, data: { token: signToken(user), user } });
}

export async function me(req, res) {
  res.json({ success: true, data: { user: req.user } });
}
