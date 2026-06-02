import express from "express";
import {
  getCurrentUser,
  login,
  logout,
  refreshAccessToken,
  heartbeat,
  register,
  markProfileComplete,
} from "../controllers/authController";
import {
  googleOAuthCallbackHandler,
  startGoogleOAuthHandler,
} from "../controllers/oauthProviderController";
import { exchangeOAuthCode } from "../controllers/oauthController";
import { authenticateJwt } from "../middleware/authMiddleware";
import {
  authLoginLimiter,
  authRegisterLimiter,
  oauthStartLimiter,
} from "../middleware/authRateLimiter";

const router = express.Router();

router.post("/register", authRegisterLimiter, register);
router.post("/login", authLoginLimiter, login);

// Google OAuth (Arctic on Express — source of truth)
router.get("/google", oauthStartLimiter, startGoogleOAuthHandler);
router.get("/google/callback", oauthStartLimiter, googleOAuthCallbackHandler);
// Add more providers when env is configured, e.g.:
// router.get("/facebook", oauthStartLimiter, (req, res) => startOAuthHandler({ ...req, params: { provider: "facebook" } }, res));
router.get("/oauth/exchange", oauthStartLimiter, exchangeOAuthCode);

router.get("/me", authenticateJwt, getCurrentUser);
router.patch("/profile/complete", authenticateJwt, markProfileComplete);
router.post("/refresh-token", refreshAccessToken);
router.post("/heartbeat", authenticateJwt, heartbeat);
router.post("/logout", logout);

export default router;
