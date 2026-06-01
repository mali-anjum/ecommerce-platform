import type { Request, Response } from "express";
import { oauthService } from "../services/oauth/oauthService";

function startOAuthForProvider(
  providerSlug: string,
  _req: Request,
  res: Response,
): void {
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
    console.error(`${providerSlug} OAuth start error:`, error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Unable to start ${providerSlug} OAuth`,
    });
  }
}

async function handleOAuthCallbackForProvider(
  providerSlug: string,
  req: Request,
  res: Response,
): Promise<void> {
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
    console.error(`${providerSlug} OAuth callback error:`, error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `${providerSlug} OAuth callback failed`,
    });
  }
}

export function startOAuthHandler(req: Request, res: Response): void {
  const providerSlug =
    typeof req.params.provider === "string" ? req.params.provider : "google";
  startOAuthForProvider(providerSlug, req, res);
}

export async function oauthCallbackHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const providerSlug =
    typeof req.params.provider === "string" ? req.params.provider : "google";
  await handleOAuthCallbackForProvider(providerSlug, req, res);
}

export function startGoogleOAuthHandler(req: Request, res: Response): void {
  startOAuthForProvider("google", req, res);
}

export async function googleOAuthCallbackHandler(
  req: Request,
  res: Response,
): Promise<void> {
  await handleOAuthCallbackForProvider("google", req, res);
}
