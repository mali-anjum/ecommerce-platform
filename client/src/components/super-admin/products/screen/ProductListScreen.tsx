"use client";

import Link from "next/link";
import { ProductTableSkeleton } from "../atoms/ProductTableSkeleton";
import { ProductSearchBar } from "../molecules/ProductSearchBar";
import { ProductTable } from "../organisms/ProductTable";
import { ProductManagementHeader } from "../organisms/ProductManagementHeader";
import { useProductManagement } from "../hooks/useProductManagement";
import { ADMIN_ONLY_ROLES } from "@/components/auth/types/User";


interface ProductManagementScreenProps {
  allowedRole: ADMIN_ONLY_ROLES;
  title: string;
  subtitle: string;
  addHref: string;
  editHrefBase: string;
  emptyStateText: string;
  deniedText: string;
}

export default function ProductManagementScreen({
  allowedRole,
  title,
  subtitle,
  addHref,
  editHrefBase,
  emptyStateText,
  deniedText,
}: ProductManagementScreenProps) {
  const {
    isClient,
    isLoading,
    user,
    query,
    setQuery,
    filteredProducts,
    handleDelete,
    handleEdit,
  } = useProductManagement({ allowedRole, editHrefBase });

  if (!isClient) return <ProductTableSkeleton />;

  if (!user?.role || 
    allowedRole.includes(user.role as ADMIN_ONLY_ROLES)
  ) {
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
      <ProductManagementHeader 
        title={title}
        subtitle={subtitle}
        addHref={addHref}
      />

      <ProductSearchBar 
        value={query}
        onChange={setQuery}
      />

      <ProductTable 
        products={filteredProducts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyStateText={emptyStateText}
      />
    </div>
  );
}