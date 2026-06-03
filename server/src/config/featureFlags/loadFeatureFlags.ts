/**
 * Loads server/feature-flags.config.json (synced from client at build).
 * Plain functions + module cache — no class needed (stateless reads, one shared cache).
 */
import fs from "fs";
import path from "path";
import { SERVER_FLAG_DEFAULTS, inferParentKey } from "./defaults";

export type FeatureFlagsConfigFile = {
  flags?: Record<string, boolean>;
};

type CacheEntry = {
  path: string;
  mtimeMs: number;
  resolved: Record<string, boolean>;
};

let cache: CacheEntry | null = null;

/** Server package root (…/server), stable in dev (src) and prod (dist). */
function getServerRoot(): string {
  return path.resolve(__dirname, "../../..");
}

export function resolveFeatureFlagsConfigPath(): string {
  const envPath = process.env.FEATURE_FLAGS_CONFIG_PATH?.trim();
  if (envPath) {
    return path.resolve(envPath);
  }

  const bundled = path.join(getServerRoot(), "feature-flags.config.json");
  if (fs.existsSync(bundled)) {
    return bundled;
  }

  throw new Error(
    "server/feature-flags.config.json missing. Run `npm run sync:feature-flags` or `npm run build`.",
  );
}

/** Forces child flags off when {module}.enabled is off (e.g. ai.chat → ai.enabled). */
function applyParentGating(raw: Record<string, boolean>): Record<string, boolean> {
  const resolved = { ...raw };

  for (const key of Object.keys(resolved)) {
    const parentKey = inferParentKey(key);
    if (parentKey && resolved[parentKey] !== true) {
      resolved[key] = false;
    }
  }

  return resolved;
}

function buildResolvedFlags(): Record<string, boolean> {
  const configPath = resolveFeatureFlagsConfigPath();
  const stat = fs.statSync(configPath);

  if (cache && cache.path === configPath && cache.mtimeMs === stat.mtimeMs) {
    return cache.resolved;
  }

  const file = JSON.parse(
    fs.readFileSync(configPath, "utf-8"),
  ) as FeatureFlagsConfigFile;

  const fileFlags = file.flags ?? {};
  const raw: Record<string, boolean> = {};

  for (const key of Object.keys(SERVER_FLAG_DEFAULTS)) {
    const defaultValue = SERVER_FLAG_DEFAULTS[key as keyof typeof SERVER_FLAG_DEFAULTS];
    // Key in JSON → use JSON; missing → use default from defaults.ts.
    raw[key] =
      fileFlags[key] !== undefined ? fileFlags[key] === true : defaultValue;
  }

  const resolved = applyParentGating(raw);

  cache = {
    path: configPath,
    mtimeMs: stat.mtimeMs,
    resolved,
  };

  return resolved;
}

export function getResolvedFeatureFlags(): Record<string, boolean> {
  return buildResolvedFlags();
}

export function resetFeatureFlagsCache(): void {
  cache = null;
}

export function getFeatureFlagsConfigMeta(): {
  path: string;
  updatedAt: string;
} {
  const configPath = resolveFeatureFlagsConfigPath();
  const stat = fs.statSync(configPath);
  return {
    path: configPath,
    updatedAt: stat.mtime.toISOString(),
  };
}
