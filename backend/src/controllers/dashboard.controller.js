import { Review } from "../models/review.model.js";
import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

/**
 * GET /api/dashboard
 * Full analytics summary for the logged-in user.
 */
export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const results = await Promise.allSettled([
      getSummaryStats(userId),
      getLanguageBreakdown(userId),
      getScoreOverTime(userId),
      getRecentReviews(userId),
      getTopIssues(userId),
    ]);

    const [
      summary,
      languageBreakdown,
      scoreOverTime,
      recentReviews,
      topIssues,
    ] = results.map(r => (r.status === "fulfilled" ? r.value : null));

    logger.info(`Dashboard fetched for user: ${userId}`);

    res.json({
      success: true,
      data: {
        user: {
          name: req.user.name,
          reviewCount: req.user.reviewCount,
          memberSince: req.user.createdAt,
        },
        summary: summary || {},
        languageBreakdown: languageBreakdown || [],
        scoreOverTime: scoreOverTime || [],
        recentReviews: recentReviews || [],
        topIssues: topIssues || [],
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const getSummaryStats = async (userId) => {
  const userObjectId =
    typeof userId === "string"
      ? new mongoose.Types.ObjectId(userId)
      : userId;

  const result = await Review.aggregate([
    { $match: { user: userObjectId } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        avgScore: { $avg: "$overallScore" },
        totalCritical: { $sum: { $ifNull: ["$issueCount.critical", 0] } },
        totalWarnings: { $sum: { $ifNull: ["$issueCount.warning", 0] } },
        totalSuggestions: { $sum: { $ifNull: ["$issueCount.suggestion", 0] } },
        totalTokens: { $sum: { $ifNull: ["$tokensUsed", 0] } },
      },
    },
  ]);

  if (!result.length) {
    return {
      totalReviews: 0,
      avgScore: 0,
      totalCritical: 0,
      totalWarnings: 0,
      totalSuggestions: 0,
      totalTokens: 0,
    };
  }

  const s = result[0];

  return {
    totalReviews: s.totalReviews,
    avgScore: Number(s.avgScore?.toFixed(1)) || 0,
    totalCritical: s.totalCritical,
    totalWarnings: s.totalWarnings,
    totalSuggestions: s.totalSuggestions,
    totalTokens: s.totalTokens,
  };
};

const getLanguageBreakdown = async (userId) => {
  const userObjectId =
    typeof userId === "string"
      ? new mongoose.Types.ObjectId(userId)
      : userId;

  return Review.aggregate([
    {
      $match: {
        user: userObjectId,
        language: { $ne: null },
      },
    },
    {
      $group: {
        _id: { $toLower: "$language" },
        count: { $sum: 1 },
        avgScore: { $avg: { $ifNull: ["$overallScore", 0] } },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 8 },
    {
      $project: {
        language: "$_id",
        count: 1,
        avgScore: { $round: ["$avgScore", 1] },
        _id: 0,
      },
    },
  ]);
};

const getScoreOverTime = async (userId) => {
  const userObjectId =
    typeof userId === "string"
      ? new mongoose.Types.ObjectId(userId)
      : userId;

  // Last 30 days filter
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return Review.aggregate([
    {
      $match: {
        user: userObjectId,
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateTrunc: {
            date: "$createdAt",
            unit: "day",
          },
        },
        avgScore: { $avg: { $ifNull: ["$overallScore", 0] } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: "$_id",
        avgScore: { $round: ["$avgScore", 1] },
        count: 1,
        _id: 0,
      },
    },
  ]);
};

const getRecentReviews = async (userId) => {
  const userObjectId =
    typeof userId === "string"
      ? new mongoose.Types.ObjectId(userId)
      : userId;

  const reviews = await Review.find({ user: userObjectId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("_id fileName language overallScore grade issueCount createdAt")
    .lean();

  return reviews.map(r => ({
    _id: r._id,
    fileName: r.fileName,
    language: r.language || "unknown",
    overallScore: r.overallScore ?? 0,
    grade: r.grade || "N/A",
    issueCount: {
      critical: r.issueCount?.critical ?? 0,
      warning: r.issueCount?.warning ?? 0,
      suggestion: r.issueCount?.suggestion ?? 0,
    },
    createdAt: r.createdAt,
  }));
};

const getTopIssues = async (userId) => {
  const userObjectId =
    typeof userId === "string"
      ? new mongoose.Types.ObjectId(userId)
      : userId;

  return Review.aggregate([
    { $match: { user: userObjectId } },

    // Flatten issues array
    { $unwind: "$issues" },

    {
      $group: {
        _id: "$issues.category",
        count: { $sum: 1 },
        critical: {
          $sum: {
            $cond: [{ $eq: ["$issues.severity", "critical"] }, 1, 0],
          },
        },
      },
    },

    { $sort: { count: -1 } },
    { $limit: 6 },

    {
      $project: {
        category: "$_id",
        count: 1,
        critical: 1,
        _id: 0,
      },
    },
  ]);
};
