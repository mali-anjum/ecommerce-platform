import { randomBytes } from "crypto";
import type { SessionUser } from "../auth/tokenService";

type ExchangeEntry = {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
  redirectTo: string;
  expiresAt: number;
};

type CreateExchangeInput = Omit<ExchangeEntry, "expiresAt">;

/** In-memory one-time OAuth session handoff codes (60s TTL). */
export class OAuthExchangeStore {
  private readonly ttlMs = 60_000;
  private readonly store = new Map<string, ExchangeEntry>();

  private purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) this.store.delete(key);
    }
  }

  create(entry: CreateExchangeInput): string {
    this.purgeExpired();
    const code = randomBytes(32).toString("base64url");
    this.store.set(code, { ...entry, expiresAt: Date.now() + this.ttlMs });
    return code;
  }

  consume(code: string): ExchangeEntry | null {
    this.purgeExpired();
    const entry = this.store.get(code);
    if (!entry) return null;
    this.store.delete(code);
    if (entry.expiresAt <= Date.now()) return null;
    return entry;
  }
}

export const oauthExchangeStore = new OAuthExchangeStore();

export const createOAuthExchange = (entry: CreateExchangeInput) =>
  oauthExchangeStore.create(entry);

export const consumeOAuthExchange = (code: string) =>
  oauthExchangeStore.consume(code);
