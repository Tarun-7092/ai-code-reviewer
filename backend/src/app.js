import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { config } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import { logger } from "./utils/logger.js";

import authRoutes from "./routes/auth.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import historyRoutes from "./routes/history.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();
const allowedOrigins = config.corsOrigin.split(",");
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});

// ── Security & Middleware ──────────────────────────────────────────────────────
app.use(helmet({crossOriginResourcePolicy: false}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);
app.use("/api", limiter);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

if (config.nodeEnv !== "test") {
  app.use(morgan("dev", { stream: { write: (msg) => logger.http(msg.trim()) } }));
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/review",    reviewRoutes);
app.use("/api/history",   historyRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "AI Code Reviewer", env: config.nodeEnv, ts: new Date().toISOString() })
);

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
