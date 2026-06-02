import type { BaseOAuthProvider } from "./internal/baseOAuthProvider";
import type { OAuthCallbackRequest } from "./internal/types";
import { OAuthFactory } from "./oauthFactory";
import type { Response } from "express";

/**
 * Public facade for OAuth sign-in. Controllers should use `oauthService` only.
 */
export class OAuthService {
  getProvider(providerSlug: string): BaseOAuthProvider {
    return OAuthFactory.createProvider(providerSlug);
  }

  getConfiguredProviders() {
    return OAuthFactory.getConfiguredProviders();
  }

  start(providerSlug: string, res: Response): void {
    this.getProvider(providerSlug).start(res);
  }

  async handleCallback(
    providerSlug: string,
    req: OAuthCallbackRequest,
    res: Response,
  ): Promise<void> {
    await this.getProvider(providerSlug).handleCallback(req, res);
  }
}

export const oauthService = new OAuthService();
