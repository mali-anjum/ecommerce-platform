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
import {
  forgotPassword,
  resendVerificationEmail,
  resetPassword,
  verifyEmail,
} from "../controllers/accountController";
import { authenticateJwt } from "../middleware/authMiddleware";
import {
  accountEmailLimiter,
  accountTokenLimiter,
  authLoginLimiter,
  authRegisterLimiter,
  oauthStartLimiter,
} from "../middleware/authRateLimiter";
import { validate } from "../middleware/validation";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../validations/accountSchema";

const router = express.Router();

router.post("/register", authRegisterLimiter, register);
router.post("/login", authLoginLimiter, login);

// Password reset and email verification (single-use emailed tokens)
router.post("/forgot-password", accountEmailLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", accountTokenLimiter, validate(resetPasswordSchema), resetPassword);
router.post("/verify-email", accountTokenLimiter, validate(verifyEmailSchema), verifyEmail);
router.post("/resend-verification", accountEmailLimiter, authenticateJwt, resendVerificationEmail);

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
