import { verifyToken, extractBearer } from "../utils/jwt.js";
import { User } from "../models/user.model.js";
import { logger } from "../utils/logger.js";

/**
 * Protect routes — requires a valid JWT in Authorization header.
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided. Please log in." });
    }

    const token = extractBearer(authHeader);

    const decoded = verifyToken(token);

    if (!decoded?.id) {
      return res.status(401).json({ error: "Invalid token payload." });
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ error: "User no longer exists." });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is deactivated." });
    }

    // Optional but important (token invalidation after password change)
    if (user.passwordChangedAt && decoded.iat) {
      const changedTime = parseInt(user.passwordChangedAt.getTime() / 1000);
      if (changedTime > decoded.iat) {
        return res.status(401).json({
          error: "Token expired due to password change.",
        });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    logger.warn("Auth failed");

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please log in again." });
    }

    return res.status(401).json({ error: "Invalid token." });
  }
};

/**
 * Restrict to specific roles. Call after protect().
 * Usage: restrictTo("admin")
 */
export const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "You do not have permission to perform this action." });
  }
  next();
};
