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
