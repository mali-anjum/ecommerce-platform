export { OAuthAccountService, mapProviderId, oauthAccountService } from "./oauthAccountService";
export { BaseOAuthProvider } from "./baseOAuthProvider";
export { OAuthExchangeStore, oauthExchangeStore, createOAuthExchange, consumeOAuthExchange } from "./oauthExchangeStore";
export { OAuthFactory, OAuthService, oauthService } from "./oauthService";
export type {
  NormalizedOAuthProfile,
  OAuthCallbackRequest,
  OAuthProfileInput,
  PendingOAuthState,
} from "./types";

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
