/**
 * Server flag whitelist + fallback defaults.
 *
 * CONTRIBUTOR: see README.md in this folder.
 * - API/expensive flag → add key here AND client/feature-flags.config.json
 * - UI-only flag → JSON + client isFeatureEnabled only (do not add here)
 */
export const SERVER_FLAG_DEFAULTS = {
  // ── Payments (checkout / Postman) ─────────────────────────────────────────
  "payments.enabled": true,
  "payments.paypal": true,
  "payments.stripe": true,

  // ── AI commerce (routes, LLM, leads) ──────────────────────────────────────
  "ai.enabled": true,
  "ai.chat": true,
  "ai.productRecommendations": true,
  "ai.orderSupport": true,
  "ai.leadCapture": true,
  "ai.humanHandoff": true,

  // ── New module template (copy, uncomment, sync JSON) ──────────────────────
  // "yourModule.enabled": true,
  // "yourModule.expensiveApi": true,
} as const satisfies Record<string, boolean>;

export type ServerFeatureFlagKey = keyof typeof SERVER_FLAG_DEFAULTS;

/** Child flags gate under {firstSegment}.enabled — see README.md */
export function inferParentKey(key: string): string | undefined {
  if (key.endsWith(".enabled") || !key.includes(".")) {
    return undefined;
  }
  return `${key.split(".")[0]}.enabled`;
}

export function getModuleMasterKey(module: string): string {
  return `${module}.enabled`;
}
