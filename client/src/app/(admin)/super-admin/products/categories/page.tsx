"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "axios";
import {
  Layers,
  Sparkles,
  RefreshCw,
  Package,
  ExternalLink,
  AlertCircle,
  Hash,
  FolderTree,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { sentryTracker } from "@/lib/monitoring";

type StructureSub = {
  id: string;
  title: string;
  slug: string;
  sortOrder?: number;
};

type StructureDept = {
  id: string;
  title: string;
  slug: string;
  sortOrder?: number;
  description?: string | null;
  subcategories: StructureSub[];
};

type TreeSub = {
  title: string;
  slug: string;
  productCount: number;
};

type TreeDept = {
  title: string;
  slug: string;
  productCount: number;
  subcategories: TreeSub[];
};

type MergedSub = StructureSub & { productCount: number };
type MergedDept = StructureDept & {
  productCount: number;
  subcategories: MergedSub[];
};

function mergeStructureWithTree(
  structure: StructureDept[],
  tree: TreeDept[]
): MergedDept[] {
  return structure.map((dept) => {
    const t = tree.find((d) => d.slug === dept.slug);
    return {
      ...dept,
      productCount: t?.productCount ?? 0,
      subcategories: dept.subcategories.map((sub) => {
        const ts = t?.subcategories.find((s) => s.slug === sub.slug);
        return {
          ...sub,
          productCount: ts?.productCount ?? 0,
        };
      }),
    };
  });
}

function SuperAdminCategoriesPage() {
  const [departments, setDepartments] = useState<MergedDept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const structureRes = await axios.get("/api/catalog/structure", {
        withCredentials: true,
      });
      const rawStructure = structureRes.data?.data;
      const structure: StructureDept[] = Array.isArray(rawStructure)
        ? rawStructure
        : [];

      let tree: TreeDept[] = [];
      try {
        const treeRes = await axios.get("/api/catalog/tree", {
          withCredentials: true,
        });
        const rawTree = treeRes.data?.data;
        if (Array.isArray(rawTree)) {
          tree = rawTree;
        }
      } catch {
        // Product counts are optional; structure alone still lists departments.
      }

      setDepartments(mergeStructureWithTree(structure, tree));
    } catch (e) {
    sentryTracker(e, { source: "page" });
      const message = axios.isAxiosError(e)
        ? e.response?.data?.message ||
          e.response?.data?.error ||
          e.message
        : "Could not load catalog.";
      setError(message);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const totals = useMemo(() => {
    let subs = 0;
    let products = 0;
    for (const d of departments) {
      subs += d.subcategories.length;
      products += d.productCount;
    }
    return {
      departments: departments.length,
      subcategories: subs,
      products,
    };
  }, [departments]);

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-card/30 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="glass-effect rounded-2xl p-6 border border-glass-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="h-12 w-12 rounded-xl bg-linear-to-br from-primary to-secondary flex items-center justify-center">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -inset-2 rounded-xl bg-primary/20 animate-pulse -z-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
                  Category catalog
                  <Sparkles className="h-7 w-7 text-primary" />
                </h1>
                <p className="text-muted-foreground mt-1 max-w-2xl">
                  Departments and subcategories power filters on the storefront and the
                  product form. Counts reflect products linked by subcategory or legacy
                  category title.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="border-border"
                onClick={() => void loadCatalog()}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                asChild
                className="bg-linear-to-r from-primary to-secondary hover:opacity-90"
              >
                <Link href="/super-admin/products/add">
                  <Package className="h-4 w-4 mr-2" />
                  Add product
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Departments",
              value: totals.departments,
              icon: Layers,
            },
            {
              label: "Subcategories",
              value: totals.subcategories,
              icon: FolderTree,
            },
            {
              label: "Products (catalog total)",
              value: totals.products,
              icon: Package,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="glass-effect rounded-2xl p-5 border border-glass-border"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div
            role="alert"
            className="flex gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Could not load catalog</p>
              <p className="mt-1 text-muted-foreground">{error}</p>
              <p className="mt-2 text-muted-foreground">
                Confirm <code className="rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_API_URL</code>{" "}
                and the server proxy URL (<code className="rounded bg-muted px-1 py-0.5">DEV_URL</code>{" "}
                in development) in <code className="rounded bg-muted px-1 py-0.5">client/.env.local</code>{" "}
                all point at the same API, then try Refresh.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && departments.length === 0 && (
          <div className="glass-effect rounded-2xl p-8 border border-amber-500/30 bg-amber-500/5">
            <div className="flex gap-4">
              <AlertCircle className="h-8 w-8 shrink-0 text-amber-600" />
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">
                  No departments yet
                </h2>
                <p className="text-muted-foreground">
                  Run migrations and seed the database from the{" "}
                  <code className="rounded bg-muted px-1 py-0.5">server</code> package (e.g.{" "}
                  <code className="rounded bg-muted px-1 py-0.5">npm run prisma:seed</code>
                  ), or use your admin seed endpoint so departments and subcategories appear
                  here.
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="glass-effect rounded-2xl border border-glass-border p-12 text-center">
            <RefreshCw className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Loading catalog…</p>
          </div>
        ) : (
          <div className="space-y-6">
            {departments.map((dept) => (
              <section
                key={dept.id}
                className="glass-effect rounded-2xl border border-glass-border overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-glass-border bg-card/40">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-foreground">{dept.title}</h2>
                      <Badge variant="outline" className="border-primary/40 text-primary">
                        <Hash className="h-3 w-3 mr-1" />
                        {dept.slug}
                      </Badge>
                    </div>
                    {dept.description ? (
                      <p className="text-sm text-muted-foreground mt-1">{dept.description}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary/15 text-primary border-primary/20">
                      {dept.productCount} products
                    </Badge>
                    <Button variant="outline" size="sm" className="border-border" asChild>
                      <Link
                        href={`/products?departmentSlug=${encodeURIComponent(dept.slug)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View in shop
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-glass-border hover:bg-transparent">
                        <TableHead className="text-foreground">Subcategory</TableHead>
                        <TableHead className="text-foreground">Slug</TableHead>
                        <TableHead className="text-right text-foreground">Products</TableHead>
                        <TableHead className="text-right text-foreground">Shop</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dept.subcategories.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground py-8"
                          >
                            No subcategories for this department.
                          </TableCell>
                        </TableRow>
                      ) : (
                        dept.subcategories.map((sub: MergedSub) => (
                          <TableRow
                            key={sub.id}
                            className="border-glass-border hover:bg-primary/5"
                          >
                            <TableCell className="font-medium text-foreground">
                              {sub.title}
                            </TableCell>
                            <TableCell>
                              <code className="text-xs rounded bg-muted px-2 py-1">
                                {sub.slug}
                              </code>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {sub.productCount}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="h-8" asChild>
                                <Link
                                  href={`/products?departmentSlug=${encodeURIComponent(
                                    dept.slug
                                  )}&subcategorySlug=${encodeURIComponent(sub.slug)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SuperAdminCategoriesPage;
