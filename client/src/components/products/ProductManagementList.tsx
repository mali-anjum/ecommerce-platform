"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ProductTableSkeleton } from "@/components/products/ProductTableSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { useProductStore } from "@/store/useProductStore";

type AllowedRole = "SUPER_ADMIN" | "SELLER";

interface ProductManagementListProps {
  allowedRole: AllowedRole;
  title: string;
  subtitle: string;
  addHref: string;
  editHrefBase: string;
  emptyStateText: string;
  deniedText: string;
}

export default function ProductManagementList({
  allowedRole,
  title,
  subtitle,
  addHref,
  editHrefBase,
  emptyStateText,
  deniedText,
}: ProductManagementListProps) {
  const { products, isLoading, fetchAllProductsForAdmin, deleteProduct } =
    useProductStore();
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const router = useRouter();
  const fetchedRef = useRef(false);
  const [isClient, setIsClient] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    if (!isClient || user?.role !== allowedRole || fetchedRef.current) return;
    fetchedRef.current = true;
    fetchAllProductsForAdmin();
  }, [allowedRole, fetchAllProductsForAdmin, isClient, user?.role]);

  const filteredProducts = useMemo(() => {
    const rows = products ?? [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return rows;
    return rows.filter(
      (product) =>
        product.name?.toLowerCase().includes(normalizedQuery) ||
        product.category?.toLowerCase().includes(normalizedQuery)
    );
  }, [products, query]);

  async function handleDelete(productId: string) {
    if (!window.confirm("Delete this product?")) return;
    const ok = await deleteProduct(productId);

    if (!ok) {
      toast({
        title: "Error",
        description: "Could not delete product",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Product Deleted",
      description:
        "Product was deleted. Cloudinary image cleanup is handled by backend.",
    });
    fetchAllProductsForAdmin();
  }

  if (!isClient) return <ProductTableSkeleton />;

  if (user?.role !== allowedRole) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">
          {deniedText}{" "}
          <Link href="/seller/register" className="text-primary underline">
            Register as seller
          </Link>
        </p>
      </div>
    );
  }

  if (isLoading) return <ProductTableSkeleton />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button asChild>
          <Link href={addHref}>
            <Plus className="h-4 w-4 mr-2" />
            Add product
          </Link>
        </Button>
      </div>

      <div className="max-w-md">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by product or category"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  {emptyStateText}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {product.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                  <TableCell>{product.stock ?? 0}</TableCell>
                  <TableCell>{product.category || "Uncategorized"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        router.push(`${editHrefBase}${encodeURIComponent(product.id)}`)
                      }
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
