import User, { ROLES } from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { verifyToken } from "../utils/token.js";

function extractToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

async function resolveUser(token) {
  const payload = verifyToken(token);
  const user = await User.findById(payload.sub).select("+passwordChangedAt");
  if (!user) throw ApiError.unauthorized("The account for this session no longer exists");
  if (user.tokenIssuedBeforePasswordChange(payload.iat)) {
    throw ApiError.unauthorized("Your password was changed. Please sign in again.");
  }
  return user;
}

/** Requires a valid Bearer token; attaches the user document to req.user. */
export async function protect(req, _res, next) {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized();
  req.user = await resolveUser(token);
  next();
}

/** Attaches req.user when a valid token is present, but never rejects the request. */
export async function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = await resolveUser(token);
    } catch {
      req.user = undefined;
    }
  }
  next();
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) throw ApiError.forbidden();
    next();
  };
}

export const requireAdmin = [protect, requireRole(ROLES.ADMIN)];
