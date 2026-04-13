import { User } from "../models/user.model.js";
import { signToken } from "../utils/jwt.js";
import { logger } from "../utils/logger.js";

const sendAuthResponse = (res, statusCode, user, message) => {
  const token = signToken({ id: user._id, email: user.email, role: user.role });
  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      reviewCount: user.reviewCount,
      createdAt: user.createdAt,
    },
  });
};

/**
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    let { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    // Normalize email
    email = email.toLowerCase().trim();

    // Check existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already in use." });
    }

    // Create user
    const user = await User.create({ name: name.trim(), email, password });

    logger.info(`New user registered: ${email}`);

    sendAuthResponse(res, 201, user, "Account created successfully.");
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    const isMatch = user ? await user.comparePassword(password) : false;

    if (!user || !isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is deactivated. Contact support." });
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    logger.info(`User logged in: ${normalizedEmail}`);

    sendAuthResponse(res, 200, user, "Login successful.");
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  const { _id, name, email, role, reviewCount, createdAt } = req.user;

  res.json({
    success: true,
    user: { id: _id, name, email, role, reviewCount, createdAt },
  });
};

/**
 * PATCH /api/auth/update-profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    let { name, avatar } = req.body;

    const updates = {};

    // Validate & sanitize name
    if (name) {
      name = name.trim();
      if (name.length < 2) {
        return res.status(400).json({ error: "Name must be at least 2 characters." });
      }
      updates.name = name;
    }

    // Validate avatar (basic URL check)
    if (avatar) {
      const isValidUrl = /^https?:\/\/.+/i.test(avatar);
      if (!isValidUrl) {
        return res.status(400).json({ error: "Invalid avatar URL." });
      }
      updates.avatar = avatar;
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({
      success: true,
      user: {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        avatar: updated.avatar,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/auth/change-password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "currentPassword and newPassword are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 8 characters." });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    const isSame = await user.comparePassword(newPassword);
    if (isSame) {
      return res.status(400).json({ error: "New password must be different from current password." });
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date(); // optional advanced feature

    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    sendAuthResponse(res, 200, user, "Password changed successfully.");
  } catch (err) {
    next(err);
  }
};
