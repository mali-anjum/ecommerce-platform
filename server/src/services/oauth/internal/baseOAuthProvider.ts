import { generateCodeVerifier, generateState, OAuth2RequestError } from "arctic";
import type { OAuthProvider } from "@prisma/client";
import type { Response } from "express";
import { tokenService } from "../../auth/tokenService";
import { oauthAccountService } from "./OAuthAccountService";
import { oauthExchangeStore } from "./oauthExchangeStore";
import {
  buildOAuthCallbackUrl,
  getFrontendUrl,
  oauthErrorRedirect,
  resolvePostLoginRedirect,
} from "./oauthConfig";
import { getOAuthStateCookieOptions } from "../../../config/cookies";
import { sentryTracker } from "../../../lib/monitoring";
import type {
  NormalizedOAuthProfile,
  OAuthCallbackRequest,
  PendingOAuthState,
} from "./types";

/**
 * Shared OAuth flow: state/PKCE cookie, callback validation, user linking, JWT handoff.
 * Provider-specific logic lives in subclasses.
 */
export abstract class BaseOAuthProvider {
  abstract readonly provider: OAuthProvider;
  abstract readonly routeSlug: string;
  abstract readonly displayName: string;
  /** Google and Microsoft use PKCE; Facebook/GitHub do not. */
  abstract readonly usesPkce: boolean;

  abstract isConfigured(): boolean;
  abstract buildAuthorizationUrl(
    state: string,
    codeVerifier?: string,
  ): URL;
  abstract fetchProfile(
    code: string,
    codeVerifier?: string,
  ): Promise<NormalizedOAuthProfile>;

  getRedirectUri(): string {
    return buildOAuthCallbackUrl(this.routeSlug);
  }

  getStateCookieName(): string {
    return `oauth_${this.routeSlug}_state`;
  }

  start(res: Response): void {
    const state = generateState();
    const codeVerifier = this.usesPkce ? generateCodeVerifier() : undefined;

    const url = this.buildAuthorizationUrl(state, codeVerifier);
    const payload: PendingOAuthState = { state, codeVerifier };

    res.cookie(
      this.getStateCookieName(),
      JSON.stringify(payload),
      getOAuthStateCookieOptions(),
    );
    res.redirect(url.toString());
  }

  async handleCallback(req: OAuthCallbackRequest, res: Response): Promise<void> {
    const cookieName = this.getStateCookieName();
    res.clearCookie(cookieName, { path: "/" });

    const error = typeof req.query.error === "string" ? req.query.error : null;
    if (error) {
      const message =
        error === "access_denied"
          ? `${this.displayName} sign-in was cancelled`
          : error;
      res.redirect(oauthErrorRedirect(message));
      return;
    }

    const code = typeof req.query.code === "string" ? req.query.code : null;
    const state = typeof req.query.state === "string" ? req.query.state : null;
    const rawPending = req.cookies[cookieName];

    if (!code || !state || !rawPending) {
      res.redirect(oauthErrorRedirect("Missing OAuth callback parameters"));
      return;
    }

    let pending: PendingOAuthState;
    try {
      pending = JSON.parse(rawPending) as PendingOAuthState;
    } catch {
      res.redirect(oauthErrorRedirect("Invalid OAuth state"));
      return;
    }

    if (pending.state !== state) {
      res.redirect(oauthErrorRedirect("OAuth state mismatch"));
      return;
    }

    try {
      const profile = await this.fetchProfile(code, pending.codeVerifier);

      if (!profile.email) {
        res.redirect(
          oauthErrorRedirect(`${this.displayName} did not return an email address`),
        );
        return;
      }

      const { userId } = await oauthAccountService.findOrCreateUserFromOAuth({
        provider: this.provider,
        providerUserId: profile.providerUserId,
        email: profile.email,
        name: profile.name ?? null,
        image: profile.image ?? null,
        emailVerified: profile.emailVerified,
      });

      const session = await tokenService.issueSessionForUser(userId);
      const redirectTo = resolvePostLoginRedirect(session.user);

      const exchangeCode = oauthExchangeStore.create({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: session.user,
        redirectTo,
      });

      res.redirect(
        `${getFrontendUrl()}/api/auth/oauth/complete?code=${encodeURIComponent(exchangeCode)}`,
      );
    } catch (err) {
    sentryTracker(err, { source: "baseOAuthProvider" });
      if (err instanceof OAuth2RequestError) {
        res.redirect(
          oauthErrorRedirect(
            err.message || `${this.displayName} rejected the authorization request`,
          ),
        );
        return;
      }
      console.error(`${this.displayName} OAuth callback error:`, err);
      res.redirect(
        oauthErrorRedirect(
          err instanceof Error ? err.message : `${this.displayName} sign-in failed`,
        ),
      );
    }
  }
}
