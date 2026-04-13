import { Router } from "express";
import { getHistory, getReview, favoriteReview, tagReview, removeReview } from "../controllers/history.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getHistory);
router.get("/:reviewId", getReview);
router.patch("/:reviewId/favorite", favoriteReview);
router.patch("/:reviewId/tags", tagReview);
router.delete("/:reviewId", removeReview);

export default router;
