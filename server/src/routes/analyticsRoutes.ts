import express from "express";
import { authenticateJwt, isSuperAdmin } from "../middleware/authMiddleware";
import { getAnalyticsDashboard } from "../controllers/analyticsController";

const router = express.Router();

router.use(authenticateJwt, isSuperAdmin);

router.get("/dashboard", getAnalyticsDashboard);

export default router;
