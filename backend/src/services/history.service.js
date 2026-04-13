import { Review } from "../models/review.model.js";

/**
 * Paginated review history for a user.
 */
export const getUserHistory = async (userId, { page = 1, limit = 10, language, grade, search } = {}) => {
  const query = { user: userId };

  if (language) query.language = language;
  if (grade) query.grade = grade;
  if (search) query.fileName = { $regex: search, $options: "i" };

  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-codeSnippet -refactoredSnippet -issues")
      .lean(),
    Review.countDocuments(query),
  ]);

  return {
    reviews,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    hasNext: page * limit < total,
  };
};

/**
 * Get a single review by ID (only if it belongs to the user).
 */
export const getReviewById = async (reviewId, userId) => {
  const review = await Review.findOne({ _id: reviewId, user: userId }).lean();
  return review;
};

/**
 * Toggle favorite status.
 */
export const toggleFavorite = async (reviewId, userId) => {
  const review = await Review.findOne({ _id: reviewId, user: userId });
  if (!review) return null;
  review.isFavorited = !review.isFavorited;
  await review.save();
  return review;
};

/**
 * Add or update tags on a review.
 */
export const updateTags = async (reviewId, userId, tags = []) => {
  return Review.findOneAndUpdate(
    { _id: reviewId, user: userId },
    { tags: tags.slice(0, 5) }, // max 5 tags
    { new: true }
  );
};

/**
 * Delete a review.
 */
export const deleteReview = async (reviewId, userId) => {
  return Review.findOneAndDelete({ _id: reviewId, user: userId });
};
