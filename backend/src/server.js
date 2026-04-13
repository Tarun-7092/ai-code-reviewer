import { connectDB } from "./config/db.js";
import { config } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { pingAI } from "./services/ai.service.js";
import app from "./app.js";

const start = async () => {
  // 1. Connect MongoDB
  await connectDB();

  // 2. Verify Groq connectivity
  try {
    await pingAI();
    logger.info("✅ Groq AI connected");
  } catch (err) {
    logger.warn(`⚠️  Groq ping failed: ${err.message} — continuing anyway`);
  }

  // 3. Start HTTP server
  const server = app.listen(config.port, () => {
    logger.info(`\n🚀 AI Code Reviewer API`);
    logger.info(`   URL  : http://localhost:${config.port}`);
    logger.info(`   Env  : ${config.nodeEnv}`);
    logger.info(`   Health: http://localhost:${config.port}/health\n`);
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`\n🛑 ${signal} received — shutting down gracefully...`);
    server.close(async () => {
      const mongoose = await import("mongoose");
      await mongoose.default.disconnect();
      logger.info("✅ MongoDB disconnected. Goodbye.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`);
    server.close(() => process.exit(1));
  });
};

start();
