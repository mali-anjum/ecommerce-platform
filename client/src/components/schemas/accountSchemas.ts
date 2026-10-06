import * as z from "zod";

// Mirrors server/src/validations/accountSchema.ts (6–72 chars; 72 is bcrypt's input limit).
const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(72, "Password must be at most 72 characters");

const tokenSchema = z.string().trim().min(20, "Invalid or missing link").max(200, "Invalid link");

export const forgotPasswordSchema = z.object({
  email: z.string().trim().pipe(z.email("Please enter a valid email address")),
});

/** Body sent to the API (no confirm field). */
export const resetPasswordRequestSchema = z.object({
  token: tokenSchema,
  password: passwordSchema,
});

/** Form shape with confirmation. */
export const resetPasswordFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const verifyEmailRequestSchema = z.object({
  token: tokenSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;
