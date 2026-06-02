import type { OAuthProvider } from "@prisma/client";
import type { BaseOAuthProvider } from "./internal/baseOAuthProvider";
import { mapProviderId } from "./internal/helpers/providerId";
import { AppleOAuthProvider } from "./providers/appleOAuthProvider";
import { FacebookOAuthProvider } from "./providers/facebookOAuthProvider";
import { GitHubOAuthProvider } from "./providers/githubOAuthProvider";
import { GoogleOAuthProvider } from "./providers/googleOAuthProvider";
import { MicrosoftOAuthProvider } from "./providers/microsoftOAuthProvider";

/** Creates IdP-specific provider implementations from route slugs. */
export class OAuthFactory {
  static createProvider(providerSlug: string): BaseOAuthProvider {
    const provider = mapProviderId(providerSlug);
    if (!provider) {
      throw new Error(`Unsupported OAuth provider: ${providerSlug}`);
    }

    switch (provider) {
      case "GOOGLE":
        return new GoogleOAuthProvider();
      case "FACEBOOK":
        return new FacebookOAuthProvider();
      case "GITHUB":
        return new GitHubOAuthProvider();
      case "MICROSOFT":
        return new MicrosoftOAuthProvider();
      case "APPLE":
        return new AppleOAuthProvider();
      default:
        throw new Error(`Unsupported OAuth provider: ${providerSlug}`);
    }
  }

  static getConfiguredProviders(): OAuthProvider[] {
    const providers: BaseOAuthProvider[] = [
      new GoogleOAuthProvider(),
      new FacebookOAuthProvider(),
      new GitHubOAuthProvider(),
      new MicrosoftOAuthProvider(),
      new AppleOAuthProvider(),
    ];
    return providers.filter((p) => p.isConfigured()).map((p) => p.provider);
  }
}
