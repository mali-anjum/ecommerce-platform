/** Convert any thrown value into an `Error` with a message (for logs and Sentry). */
export function ensureError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  if (error == null) return new Error("Unknown error");

  if (typeof error === "object") {
    const o = error as Record<string, unknown>;
    const message =
      (typeof o.message === "string" && o.message) ||
      (typeof o.error === "string" && o.error) ||
      JSON.stringify(error);
    const err = new Error(message) as Error & { cause?: unknown };
    err.cause = error;
    return err;
  }

  return new Error(String(error));
}
