import fs from "fs";
import path from "path";
import type { LlmProviderId } from "./providers/types";

export type AiLlmConfigFile = {
  ai?: {
    llmProvider?: string;
  };
  flags?: Record<string, boolean>;
};

const DEFAULT_PROVIDER: LlmProviderId = "openai";
const VALID_PROVIDERS = new Set<LlmProviderId>(["openai", "gemini", "llama"]);

let cachedProvider: LlmProviderId | null = null;
let cachedMtime = 0;

function getConfigPath(): string {
  const envPath = process.env.FEATURE_FLAGS_CONFIG_PATH?.trim();
  if (envPath) return path.resolve(envPath);

  const serverRoot = path.resolve(__dirname, "../../..");
  const bundled = path.join(serverRoot, "feature-flags.config.json");
  if (fs.existsSync(bundled)) return bundled;

  throw new Error(
    "feature-flags.config.json missing. Run `cd server && npm run sync:feature-flags`.",
  );
}

function normalizeProvider(raw: string | undefined): LlmProviderId {
  const value = raw?.trim().toLowerCase();
  if (value && VALID_PROVIDERS.has(value as LlmProviderId)) {
    return value as LlmProviderId;
  }
  return DEFAULT_PROVIDER;
}

/** Active LLM vendor from feature-flags.config.json → ai.llmProvider */
export function getLlmProviderId(): LlmProviderId {
  const configPath = getConfigPath();
  const stat = fs.statSync(configPath);

  if (cachedProvider && cachedMtime === stat.mtimeMs) {
    return cachedProvider;
  }

  const file = JSON.parse(
    fs.readFileSync(configPath, "utf-8"),
  ) as AiLlmConfigFile;

  cachedProvider = normalizeProvider(file.ai?.llmProvider);
  cachedMtime = stat.mtimeMs;
  return cachedProvider;
}

export function resetLlmProviderCache(): void {
  cachedProvider = null;
  cachedMtime = 0;
}
