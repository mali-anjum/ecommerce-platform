import type { Request, Response } from "express";
import { setSessionCookies } from "../services/auth/tokenService";
import { oauthExchangeStore } from "../services/oauth/oauthExchangeStore";

/**
 * One-time exchange after Google OAuth callback.
 * Next.js BFF calls this to set cookies on the frontend origin.
 */
export async function exchangeOAuthCode(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    if (!code) {
      res.status(400).json({ success: false, error: "Missing exchange code" });
      return;
    }

    const entry = oauthExchangeStore.consume(code);
    if (!entry) {
      res.status(400).json({
        success: false,
        error: "Invalid or expired OAuth exchange code",
      });
      return;
    }

    await setSessionCookies(res, entry.accessToken, entry.refreshToken);

    res.status(200).json({
      success: true,
      message: "OAuth login successful",
      user: entry.user,
      redirectTo: entry.redirectTo,
    });
  } catch (error) {
    console.error("OAuth exchange error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "OAuth exchange failed",
    });
  }
}
