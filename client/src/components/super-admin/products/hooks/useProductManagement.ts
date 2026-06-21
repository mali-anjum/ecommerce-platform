"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/hooks/use-toast";
import { useAuthStore } from "@/components/auth/state/useAuthStore";
import { useProductStore } from "@/components/products/state/useProductStore";

type AllowedRole = "SUPER_ADMIN" | "SELLER";

interface UseProductManagementProps {
  allowedRole: AllowedRole;
  editHrefBase: string;
}

export function useProductManagement({ 
  allowedRole, 
  editHrefBase 
}: UseProductManagementProps) {
  const { products, isLoading, fetchAllProductsForAdmin, deleteProduct } = useProductStore();
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const router = useRouter();
  const fetchedRef = useRef(false);
  const [isClient, setIsClient] = useState(false);
  const [query, setQuery] = useState("");

  // For Browser Only Rendering to avoid hydration error
  useEffect(() => setIsClient(true), []);

  // Fetch products
  useEffect(() => {
    if (!isClient || user?.role !== allowedRole || fetchedRef.current) return;
    fetchedRef.current = true;
    fetchAllProductsForAdmin();
  }, [allowedRole, fetchAllProductsForAdmin, isClient, user?.role]);

  // Filter products
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

  // Delete handler
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
      description: "Product was deleted. Cloudinary image cleanup is handled by backend.",
    });
    fetchAllProductsForAdmin();
  }

  // Edit handler
  function handleEdit(productId: string) {
    router.push(`${editHrefBase}${encodeURIComponent(productId)}`);
  }

  return {
    isClient,
    isLoading,
    user,
    query,
    setQuery,
    filteredProducts,
    handleDelete,
    handleEdit,
  };
}