import {
  getUserHistory,
  getReviewById,
  toggleFavorite,
  updateTags,
  deleteReview,
} from "../services/history.service.js";

/**
 * GET /api/history
 * Paginated review history for current user.
 * Query params: page, limit, language, grade, search
 */
export const getHistory = async (req, res, next) => {
  try {
    const { page, limit, language, grade, search } = req.query;

    const result = await getUserHistory(req.user._id, {
      page: Math.max(Number(page) || 1, 1),
      limit: Math.min(Number(limit) || 10, 50),
      language,
      grade,
      search,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/history/:reviewId
 * Full detail of a single review.
 */
export const getReview = async (req, res, next) => {
  try {
    const review = await getReviewById(req.params.reviewId, req.user._id);
    if (!review) return res.status(404).json({ error: "Review not found." });
    res.json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/history/:reviewId/favorite
 */
export const favoriteReview = async (req, res, next) => {
  try {
    const review = await toggleFavorite(req.params.reviewId, req.user._id);
    if (!review) return res.status(404).json({ error: "Review not found." });
    res.json({ success: true, isFavorited: review.isFavorited });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/history/:reviewId/tags
 */
export const tagReview = async (req, res, next) => {
  try {
    const { tags } = req.body;

    if (!Array.isArray(tags) || tags.some(t => typeof t !== "string")) {
      return res.status(400).json({ error: "tags must be an array of strings." });
    }

    const review = await updateTags(req.params.reviewId, req.user._id, tags);

    if (!review) {
      return res.status(404).json({ error: "Review not found." });
    }

    res.json({
      success: true,
      data: { tags: review.tags },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/history/:reviewId
 */
export const removeReview = async (req, res, next) => {
  try {
    const review = await deleteReview(req.params.reviewId, req.user._id);
    if (!review) return res.status(404).json({ error: "Review not found." });
    res.json({ success: true, message: "Review deleted." });
  } catch (err) {
    next(err);
  }
};
