import dotenv from "dotenv";
dotenv.config();

// Validate required env variables
const required = ["GROQ_API_KEY", "JWT_SECRET", "MONGO_URI"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`❌ Missing required env variable: ${key}`);
  }
}

// Validate NODE_ENV
const validEnvs = ["development", "production", "test"];
if (process.env.NODE_ENV && !validEnvs.includes(process.env.NODE_ENV)) {
  throw new Error("❌ Invalid NODE_ENV value");
}

export const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",

  mongoUri: process.env.MONGO_URI,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
};