import mongoose from "mongoose";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

function normalizeError(err) {
  if (err instanceof ApiError) return err;

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.fromEntries(
      Object.entries(err.errors).map(([field, e]) => [field, e.message])
    );
    return ApiError.badRequest("Validation failed", details);
  }

  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for ${err.path}`);
  }

  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return ApiError.conflict(`A record with this ${field} already exists`);
  }

  if (err?.name === "TokenExpiredError") {
    return ApiError.unauthorized("Your session has expired, please sign in again");
  }

  if (err?.name === "JsonWebTokenError") {
    return ApiError.unauthorized("Invalid authentication token");
  }

  if (err?.type === "entity.parse.failed") {
    return ApiError.badRequest("Malformed JSON body");
  }

  if (err?.type === "entity.too.large") {
    return new ApiError(413, "Request body is too large");
  }

  const status = err?.statusCode ?? err?.status;
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    return new ApiError(status, status === 404 ? "Resource not found" : err.message);
  }

  return null;
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const known = normalizeError(err);
  const statusCode = known?.statusCode || 500;

  if (statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(statusCode).json({
    success: false,
    message: known?.message || (env.isProduction ? "Something went wrong" : err.message),
    ...(known?.details && { details: known.details }),
    ...(!env.isProduction && statusCode >= 500 && { stack: err.stack }),
  });
}
