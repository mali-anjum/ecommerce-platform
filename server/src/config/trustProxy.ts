/**
 * Number of reverse-proxy hops to trust for `req.ip` (Render, Railway, load balancers).
 * Without it every request appears to come from the proxy, so per-IP rate limits become global.
 * `TRUST_PROXY` overrides the default (1 in production, 0 locally).
 */
export function resolveTrustProxyHops(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.TRUST_PROXY?.trim();
  if (raw) {
    const hops = Number(raw);
    if (!Number.isInteger(hops) || hops < 0) {
      throw new Error(`TRUST_PROXY must be a non-negative integer, got "${raw}"`);
    }
    return hops;
  }
  return env.NODE_ENV === "production" ? 1 : 0;
}
