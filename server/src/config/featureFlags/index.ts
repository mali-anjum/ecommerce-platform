/**
 * Public API — import from here (`isFeatureEnabled`, `isModuleEnabled`).
 * How to add flags: see README.md in this folder.
 */
import { getModuleMasterKey } from "./defaults";
import {
  getResolvedFeatureFlags,
  resetFeatureFlagsCache,
} from "./loadFeatureFlags";

export {
  SERVER_FLAG_DEFAULTS,
  type ServerFeatureFlagKey,
  getModuleMasterKey,
} from "./defaults";
export {
  getFeatureFlagsConfigMeta,
  getResolvedFeatureFlags,
  resetFeatureFlagsCache,
  resolveFeatureFlagsConfigPath,
} from "./loadFeatureFlags";
export { registerFeatureModuleRoutes, type FeatureModuleMount } from "./registerModules";

/** Unknown or client-only keys (not in SERVER_FLAG_DEFAULTS) are always false on the server. */
export function isFeatureEnabled(key: string): boolean {
  return getResolvedFeatureFlags()[key] === true;
}

export function isModuleEnabled(module: string): boolean {
  return isFeatureEnabled(getModuleMasterKey(module));
}
