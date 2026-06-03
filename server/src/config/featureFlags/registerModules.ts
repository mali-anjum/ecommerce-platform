/**
 * Conditionally mounts Express routers (e.g. /api/ai) when {module}.enabled is true.
 */
import type { Express, Router } from "express";
import { isModuleEnabled } from "./index";

export type FeatureModuleMount = {
  module: string;
  path: string;
  router: Router;
  /** Runs after the server listens, only when the module is enabled. */
  onListen?: () => void | Promise<void>;
};

/**
 * Mount routers for enabled modules. Add one entry in server.ts — see README.md.
 *
 * @example
 * registerFeatureModuleRoutes(app, [
 *   { module: "ai", path: "/api/ai", router: aiRoutes, onListen: () => warmProductIndex() },
 * ]);
 */
export function registerFeatureModuleRoutes(
  app: Express,
  mounts: FeatureModuleMount[],
): Array<() => void | Promise<void>> {
  const onListen: Array<() => void | Promise<void>> = [];

  for (const { module, path: mountPath, router, onListen: bootstrap } of mounts) {
    if (!isModuleEnabled(module)) {
      console.log(`⏸️  ${module} module disabled — ${mountPath} not registered`);
      continue;
    }

    app.use(mountPath, router);
    console.log(`✅ ${module} module enabled (${mountPath})`);

    if (bootstrap) {
      onListen.push(bootstrap);
    }
  }

  return onListen;
}
