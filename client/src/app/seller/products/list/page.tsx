"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useProductStore } from "@/store/useProductStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ProductTableSkeleton } from "@/components/products/ProductTableSkeleton";
import { Pencil, Plus, Trash2 } from "lucide-react";

export default function SellerProductsListPage() {
  const { products, isLoading, fetchAllProductsForAdmin, deleteProduct } =
    useProductStore();
  const { toast } = useToast();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const fetched = useRef(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    if (!isClient || user?.role !== "SELLER") return;
    if (fetched.current) return;
    fetched.current = true;
    fetchAllProductsForAdmin();
  }, [isClient, user?.role, fetchAllProductsForAdmin]);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this product?")) return;
    const ok = await deleteProduct(id);
    if (ok) {
      toast({ title: "Deleted", description: "Product removed." });
      fetchAllProductsForAdmin();
    } else {
      toast({
        title: "Error",
        description: "Could not delete product",
        variant: "destructive",
      });
    }
  }

  if (!isClient || user?.role !== "SELLER") {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">
          Seller access required.{" "}
          <Link href="/seller/register" className="text-primary underline">
            Register as seller
          </Link>
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <ProductTableSkeleton />;
  }

  const rows = products ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your products</h1>
          <p className="text-sm text-muted-foreground">
            Only listings you own are shown here.
          </p>
        </div>
        <Button asChild>
          <Link href="/seller/products/add">
            <Plus className="h-4 w-4 mr-2" />
            Add product
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                  No products yet. Add your first listing.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0]}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.category}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                  <TableCell>{product.stock ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        router.push(`/seller/products/add?id=${product.id}`)
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
