import { Router } from "express";
import {
  getProductReviews,
  postProductReview,
} from "../controllers/productReviewController";
import { authenticateJwt } from "../middleware/authMiddleware";
import { requireFeatureFlag, requireModule } from "../middleware/requireFeatureFlag";
import { validate } from "../middleware/validation";
import { createProductReviewSchema } from "../validations/reviewSchema";

const router = Router();

router.use(requireModule("ai"));
router.use(requireFeatureFlag("ai.reviewAnalyzer"));

router.get("/product/:productId", getProductReviews);
router.post("/", authenticateJwt, validate(createProductReviewSchema), postProductReview);

export default router;
