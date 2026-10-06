import axios from "axios";

type ApiErrorBody = {
  message?: unknown;
  error?: unknown;
  errors?: Array<{ message?: unknown }>;
};

/** Picks the most specific user-facing message from an API error (express `message`, auth `error`, zod `errors`). */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429) {
      return "Too many attempts. Please wait a few minutes and try again.";
    }
    const data = error.response?.data as ApiErrorBody | undefined;
    const fieldMessage = data?.errors?.[0]?.message;
    if (typeof fieldMessage === "string" && fieldMessage) return fieldMessage;
    if (typeof data?.message === "string" && data.message && data.message !== "Validation failed") {
      return data.message;
    }
    if (typeof data?.error === "string" && data.error) return data.error;
  }
  return fallback;
}

function messageFrom(data: unknown, fallback: string): string {
  const message = (data as { message?: unknown } | undefined)?.message;
  return typeof message === "string" && message ? message : fallback;
}

export async function requestPasswordReset(email: string): Promise<string> {
  const res = await axios.post("/api/auth/forgot-password", { email });
  return messageFrom(
    res.data,
    "If an account exists for that email, a password reset link has been sent.",
  );
}

export async function resetPassword(token: string, password: string): Promise<string> {
  const res = await axios.post("/api/auth/reset-password", { token, password });
  return messageFrom(res.data, "Your password has been reset. Please sign in.");
}

export async function verifyEmailToken(token: string): Promise<string> {
  const res = await axios.post("/api/auth/verify-email", { token });
  return messageFrom(res.data, "Your email address has been verified.");
}

export async function resendVerificationEmail(): Promise<string> {
  const res = await axios.post("/api/auth/resend-verification", undefined, {
    withCredentials: true,
  });
  return messageFrom(res.data, "Verification email sent.");
}
