import { z } from "zod";

// Matches the existing register/login minimum; 72 is bcrypt's effective input limit.
const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(72, "Password must be at most 72 characters");

// Tokens are 32 random bytes in base64url (43 chars); bounds reject junk early.
const tokenSchema = z
  .string()
  .trim()
  .min(20, "Invalid token")
  .max(200, "Invalid token");

export const forgotPasswordSchema = z.object({
  email: z.string().trim().pipe(z.email("Valid email is required")),
});

export const resetPasswordSchema = z.object({
  token: tokenSchema,
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: tokenSchema,
});

export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailBody = z.infer<typeof verifyEmailSchema>;
