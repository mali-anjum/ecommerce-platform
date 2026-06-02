/**
 * OAuth module public API.
 * Import from `@/services/oauth` or `../services/oauth` — avoid deep paths into `internal/`.
 */

export { OAuthService, oauthService } from "./oauthService";
export { OAuthFactory } from "./oauthFactory";

export {
  OAuthAccountService,
  mapProviderId,
  oauthAccountService,
} from "./internal/oauthAccountService";

export {
  OAuthExchangeStore,
  oauthExchangeStore,
  createOAuthExchange,
  consumeOAuthExchange,
} from "./internal/oauthExchangeStore";

export { BaseOAuthProvider } from "./internal/baseOAuthProvider";

export type {
  NormalizedOAuthProfile,
  OAuthCallbackRequest,
  OAuthProfileInput,
  PendingOAuthState,
} from "./internal/types";

export {
  GoogleOAuthProvider,
  getGoogleRedirectUri,
  isGoogleConfigured,
} from "./providers/googleOAuthProvider";
export {
  FacebookOAuthProvider,
  isFacebookConfigured,
} from "./providers/facebookOAuthProvider";
export {
  GitHubOAuthProvider,
  isGitHubConfigured,
} from "./providers/githubOAuthProvider";
export {
  MicrosoftOAuthProvider,
  isMicrosoftConfigured,
} from "./providers/microsoftOAuthProvider";
export {
  AppleOAuthProvider,
  isAppleConfigured,
} from "./providers/appleOAuthProvider";
