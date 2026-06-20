"use client";

import { AlertCircle } from "lucide-react";

interface ProductFormCatalogAlertsProps {
  catalogLoading: boolean;
  catalogError: string | null;
  hasDepartments: boolean;
}

export function ProductFormCatalogAlerts({
  catalogLoading,
  catalogError,
  hasDepartments,
}: ProductFormCatalogAlertsProps) {
  return (
    <>
      {catalogError && (
        <div
          role="alert"
          className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Could not load catalog</p>
            <p className="mt-1 text-muted-foreground">{catalogError}</p>
            <p className="mt-2 text-muted-foreground">
              Check <code className="rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_API_URL</code> and{" "}
              <code className="rounded bg-muted px-1 py-0.5">DEV_URL</code> in{" "}
              <code className="rounded bg-muted px-1 py-0.5">client/.env.local</code> match your
              API server URL, and that the API is running.
            </p>
          </div>
        </div>
      )}

      {!catalogLoading && !catalogError && !hasDepartments && (
        <div
          role="status"
          className="flex gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-foreground"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium text-amber-700 dark:text-amber-400">
              No departments or subcategories yet
            </p>
            <p className="mt-1 text-muted-foreground">
              The catalog comes from your database. Run migrations and seed from the{" "}
              <code className="rounded bg-muted px-1 py-0.5">server</code> folder (e.g.{" "}
              <code className="rounded bg-muted px-1 py-0.5">npm run prisma:migrate:dev</code> and{" "}
              <code className="rounded bg-muted px-1 py-0.5">npm run prisma:seed</code>), or call
              your admin catalog seed endpoint so departments appear here.
            </p>
            <p className="mt-2 text-muted-foreground">
              You can still type the category name manually below until the catalog is seeded.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
