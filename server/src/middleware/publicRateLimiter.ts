import rateLimit from "express-rate-limit";

const windowMs = 15 * 60 * 1000;

/** Public AI endpoints call paid LLM APIs; cap per IP to prevent cost abuse. */
export const aiChatLimiter = rateLimit({
  windowMs,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many assistant requests. Please wait a few minutes." },
});

export const aiSearchLimiter = rateLimit({
  windowMs,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many searches. Please wait a few minutes." },
});

/** Anonymous form posts (leads, guest email capture) to stop spam floods. */
export const publicFormLimiter = rateLimit({
  windowMs,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many submissions. Please try again later." },
});

/** Storefront tracking pings are frequent; this only stops scripted floods filling the DB. */
export const analyticsEventLimiter = rateLimit({
  windowMs,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many events." },
});
