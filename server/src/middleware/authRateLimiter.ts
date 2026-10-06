import rateLimit from "express-rate-limit";

const windowMs = 15 * 60 * 1000;

export const authLoginLimiter = rateLimit({
  windowMs,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many login attempts. Try again later." },
});

export const authRegisterLimiter = rateLimit({
  windowMs,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many registration attempts. Try again later." },
});

export const oauthStartLimiter = rateLimit({
  windowMs,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many OAuth attempts. Try again later." },
});

/** Endpoints that send email (forgot password, resend verification): tight to prevent mail flooding. */
export const accountEmailLimiter = rateLimit({
  windowMs,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many email requests. Try again later." },
});

/** Endpoints that redeem one-time tokens (reset password, verify email). */
export const accountTokenLimiter = rateLimit({
  windowMs,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many attempts. Try again later." },
});
