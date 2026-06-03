/**
 * Client feature flags — edit client/feature-flags.config.json, rebuild Next.js to apply.
 * Server/API flags: also see server/src/config/featureFlags/README.md
 */
import featureFlagsConfig from "../../../feature-flags.config.json";

const fileFlags = featureFlagsConfig.flags as Record<string, boolean | undefined>;

/** e.g. "ai.chat" → parent "ai.enabled"; "ai.enabled" has no parent (it is the master). */
function inferParentKey(key: string): string | undefined {
  if (key.endsWith(".enabled") || !key.includes(".")) {
    return undefined;
  }
  return `${key.split(".")[0]}.enabled`;
}

/** Off if parent master is off, no matter whether the child is explicitly true. */
function resolveFlag(key: string): boolean {
  const parentKey = inferParentKey(key);
  if (parentKey && !resolveFlag(parentKey)) {
    return false;
  }
  return fileFlags[key] === true;
}

export function isModuleEnabled(module: string): boolean {
  return resolveFlag(`${module}.enabled`);
}

export function isFeatureEnabled(key: string): boolean {
  return resolveFlag(key);
}
