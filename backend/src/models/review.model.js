import mongoose from "mongoose";

const issueSchema = new mongoose.Schema({
  line: { type: Number, default: null },
  severity: { type: String, enum: ["critical", "warning", "suggestion"], required: true },
  category: {
    type: String,
    enum: ["security", "performance", "readability", "maintainability", "best-practice", "bug", "style"],
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  suggestion: { type: String, default: "" },
  codeContext: { type: String, default: "" },
});

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    language: { type: String, default: "Unknown" },
    codeSnippet: { type: String, required: true }, // first 2000 chars stored
    summary: { type: String, default: "" },
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
    grade: { type: String, default: "F" },
    scores: {
      readability: { type: Number, default: 0 },
      performance: { type: Number, default: 0 },
      security: { type: Number, default: 0 },
      maintainability: { type: Number, default: 0 },
      bestPractices: { type: Number, default: 0 },
    },
    issues: [issueSchema],
    positives: [{ type: String }],
    refactoredSnippet: { type: String, default: null },
    issueCount: {
      critical: { type: Number, default: 0 },
      warning: { type: Number, default: 0 },
      suggestion: { type: Number, default: 0 },
    },
    tokensUsed: { type: Number, default: 0 },
    model: { type: String, default: "llama3-70b-8192" },
    isFavorited: { type: Boolean, default: false },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ user: 1, overallScore: -1 });
reviewSchema.index({ language: 1 });

export const Review = mongoose.model("Review", reviewSchema);