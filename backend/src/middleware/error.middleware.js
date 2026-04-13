import { logger } from "../utils/logger.js";
import { config } from "../config/env.js";

/**
 * Centralised error handler — must be registered LAST in app.js.
 */
export const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = "Internal Server Error";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(", ");
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : "field";
    message = `${field} already in use.`;
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired.";
  }

  logger.error({
    method: req.method,
    path: req.path,
    statusCode,
    message,
    stack: err.stack,
  });

  res.status(statusCode).json({
    error: message,
    ...(config.nodeEnv === "development" && { stack: err.stack }),
  });
};

/**
 * Catch-all for unmatched routes.
 */
export const notFound = (req, res) => {
  res.status(404).json({
    error: "Not Found",
    method: req.method,
    path: req.originalUrl,
  });
};
