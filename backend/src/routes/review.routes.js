import { Router } from "express";
import { submitReview } from "../controllers/review.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// All review routes require authentication
router.use(protect);

router.post("/", submitReview);

export default router;
