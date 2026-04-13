import { getAIReview } from "../services/ai.service.js";
import { Review } from "../models/review.model.js";
import { User } from "../models/user.model.js";
import { logger } from "../utils/logger.js";

const LANGUAGE_MAP = {
  js: "JavaScript", jsx: "JavaScript", ts: "TypeScript", tsx: "TypeScript",
  py: "Python", rb: "Ruby", java: "Java", go: "Go", rs: "Rust",
  cpp: "C++", c: "C", cs: "C#", php: "PHP", swift: "Swift",
  kt: "Kotlin", sql: "SQL", html: "HTML", css: "CSS", sh: "Bash",
};

const detectLanguage = (fileName = "") => {
  const ext = fileName.split(".").pop().toLowerCase();
  return LANGUAGE_MAP[ext] || "Unknown";
};

const computeScore = (scores = {}) => {
  const weights = { security: 0.3, performance: 0.2, readability: 0.2, maintainability: 0.2, bestPractices: 0.1 };
  let total = 0, wSum = 0;
  for (const [k, w] of Object.entries(weights)) {
    const v = parseFloat(scores[k]);
    if (!isNaN(v)) { total += Math.min(10, Math.max(0, v)) * w; wSum += w; }
  }
  return wSum === 0 ? 0 : Math.round((total / wSum) * 10);
};

const getGrade = (score) => {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
};

const countIssues = (issues = []) =>
  issues.reduce((acc, i) => { if (i.severity in acc) acc[i.severity]++; return acc; },
    { critical: 0, warning: 0, suggestion: 0 });

/**
 * POST /api/review
 * Submit code for AI review.
 */
export const submitReview = async (req, res, next) => {
  try {
    const { fileName, code } = req.body;

    if (!fileName || !code) {
      return res.status(400).json({ error: "fileName and code are required." });
    }
    if (code.length > 20000) {
      return res.status(400).json({ error: "Code too large. Maximum 20,000 characters." });
    }

    const language = detectLanguage(fileName);
    logger.info(`[Review] user=${req.user._id} file=${fileName} lang=${language}`);

    // Call Groq
    const { data, tokensUsed, model } = await getAIReview(fileName, language, code);

    // Compute scores
    const scores = {};
    for (const k of ["readability", "performance", "security", "maintainability", "bestPractices"]) {
      scores[k] = Math.min(10, Math.max(0, parseFloat(data.scores?.[k]) || 0));
    }
    const overallScore = computeScore(scores);
    const grade = getGrade(overallScore);
    const issueCount = countIssues(data.issues || []);

    // Persist
    const review = await Review.create({
      user: req.user._id,
      fileName,
      language,
      codeSnippet: code.slice(0, 2000),
      summary: data.summary || "",
      overallScore,
      grade,
      scores,
      issues: data.issues || [],
      positives: data.positives || [],
      refactoredSnippet: data.refactoredSnippet || null,
      issueCount,
      tokensUsed,
      model,
    });

    // Increment user review count
    await User.findByIdAndUpdate(req.user._id, { $inc: { reviewCount: 1 } });

    res.status(201).json({
      success: true,
      data: {
        reviewId: review._id,
        fileName,
        language,
        overallScore,
        grade,
        summary: review.summary,
        scores,
        issueCount,
        issues: review.issues,
        positives: review.positives,
        refactoredSnippet: review.refactoredSnippet,
        tokensUsed,
        model,
        createdAt: review.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};
