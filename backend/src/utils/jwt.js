import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

/**
 * Sign a JWT for a given user payload.
 * @param {{ id: string, email: string, role: string }} payload
 */
export const signToken = (payload) =>
  jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

/**
 * Verify and decode a JWT. Throws on invalid/expired.
 * @param {string} token
 */
export const verifyToken = (token) => jwt.verify(token, config.jwtSecret);

/**
 * Extract Bearer token from Authorization header.
 * @param {string|undefined} authHeader
 */
export const extractBearer = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
};
