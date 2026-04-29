/**
 * Express origin (no `/api` suffix) for Next.js Route Handlers that proxy to the backend.
 *
 * Use this everywhere server-side code forwards `fetch()` to Express so auth, cart,
 * and refresh always hit the same host/database.
 *
 * **Production:** `BACKEND_URL` (required).
 *
 * **Development:** first match wins —
 * `DEV_URL` → `DEVE_URL` (legacy alias) → `BACKEND_URL`.
 * Prefer `DEV_URL` or `DEVE_URL` for local Express; `BACKEND_URL` alone would point
 * at a remote API and break cookies issued against your local DB.
 */
export function getServerBackendUrl(): string | undefined {
  if (process.env.NODE_ENV === "production") {
    return process.env.BACKEND_URL;
  }
  return (
    process.env.DEV_URL ||
    process.env.DEVE_URL ||
    process.env.BACKEND_URL
  );
}
