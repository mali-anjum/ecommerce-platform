import express from "express";
import { authenticateJwt, isSuperAdmin } from "../middleware/authMiddleware";
import { optionalAuthenticateJwt } from "../middleware/optionalAuthMiddleware";
import { validate } from "../middleware/validation";
import { getAnalyticsDashboard } from "../controllers/analyticsController";
import { postAnalyticsEvent } from "../controllers/analyticsEventController";
import { analyticsEventSchema } from "../validations/analyticsEventSchema";

const router = express.Router();

router.post(
  "/events",
  optionalAuthenticateJwt,
  validate(analyticsEventSchema),
  postAnalyticsEvent,
);

router.use(authenticateJwt, isSuperAdmin);

router.get("/dashboard", getAnalyticsDashboard);

export default router;
