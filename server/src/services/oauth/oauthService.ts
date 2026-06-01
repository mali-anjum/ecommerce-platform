import type { OAuthProvider } from "@prisma/client";
import { BaseOAuthProvider } from "./baseOAuthProvider";
import { mapProviderId } from "./oauthAccountService";
import { AppleOAuthProvider } from "./providers/appleOAuthProvider";
import { FacebookOAuthProvider } from "./providers/facebookOAuthProvider";
import { GitHubOAuthProvider } from "./providers/githubOAuthProvider";
import { GoogleOAuthProvider } from "./providers/googleOAuthProvider";
import { MicrosoftOAuthProvider } from "./providers/microsoftOAuthProvider";

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

/** Facade for OAuth provider selection and configuration checks. */
export class OAuthService {
  getProvider(providerSlug: string): BaseOAuthProvider {
    return OAuthFactory.createProvider(providerSlug);
  }

  getConfiguredProviders(): OAuthProvider[] {
    return OAuthFactory.getConfiguredProviders();
  }

  start(providerSlug: string, res: Parameters<BaseOAuthProvider["start"]>[0]): void {
    this.getProvider(providerSlug).start(res);
  }

  async handleCallback(
    providerSlug: string,
    req: Parameters<BaseOAuthProvider["handleCallback"]>[0],
    res: Parameters<BaseOAuthProvider["handleCallback"]>[1],
  ): Promise<void> {
    await this.getProvider(providerSlug).handleCallback(req, res);
  }
}

export const oauthService = new OAuthService();
