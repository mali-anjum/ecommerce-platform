import type { Request, Response } from "express";
import { mapProviderId, oauthService } from "../services/oauth";
import { sentryTracker } from "../lib/monitoring";

/** Unknown provider slugs are a client error, not a server failure. */
function rejectUnknownProvider(providerSlug: string, res: Response): boolean {
  if (mapProviderId(providerSlug)) return false;
  res.status(404).json({ success: false, error: "Unsupported OAuth provider" });
  return true;
}

function startOAuthForProvider(
  providerSlug: string,
  _req: Request,
  res: Response,
): void {
  if (rejectUnknownProvider(providerSlug, res)) return;
  try {
    const provider = oauthService.getProvider(providerSlug);

    if (!provider.isConfigured()) {
      res.status(503).json({
        success: false,
        error: `${provider.displayName} OAuth is not configured on the server`,
      });
      return;
    }

    oauthService.start(providerSlug, res);
  } catch (error) {
    sentryTracker(error, { source: "oauthProviderController" });
    console.error(`${providerSlug} OAuth start error:`, error);
    // Raw errors can include provider config details; keep the response generic.
    res.status(500).json({
      success: false,
      error: "Unable to start sign-in. Please try again.",
    });
  }
}

async function handleOAuthCallbackForProvider(
  providerSlug: string,
  req: Request,
  res: Response,
): Promise<void> {
  if (rejectUnknownProvider(providerSlug, res)) return;
  try {
    const provider = oauthService.getProvider(providerSlug);

    if (!provider.isConfigured()) {
      res.status(503).json({
        success: false,
        error: `${provider.displayName} OAuth is not configured`,
      });
      return;
    }

    await oauthService.handleCallback(providerSlug, req, res);
  } catch (error) {
    sentryTracker(error, { source: "oauthProviderController" });
    console.error(`${providerSlug} OAuth callback error:`, error);
    res.status(500).json({
      success: false,
      error: "Sign-in failed. Please try again.",
    });
  }
}

/** Generic handler: `/api/auth/:provider` when routes are wired with a `provider` param. */
export function startOAuthHandler(req: Request, res: Response): void {
  const providerSlug =
    typeof req.params.provider === "string" ? req.params.provider : "google";
  startOAuthForProvider(providerSlug, req, res);
}

/** Generic handler: `/api/auth/:provider/callback`. */
export async function oauthCallbackHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const providerSlug =
    typeof req.params.provider === "string" ? req.params.provider : "google";
  await handleOAuthCallbackForProvider(providerSlug, req, res);
}

/** Legacy Google-specific routes (`/api/auth/google`). */
export function startGoogleOAuthHandler(req: Request, res: Response): void {
  startOAuthForProvider("google", req, res);
}

export async function googleOAuthCallbackHandler(
  req: Request,
  res: Response,
): Promise<void> {
  await handleOAuthCallbackForProvider("google", req, res);
}
