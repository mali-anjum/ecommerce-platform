"use client";

import { ProductFormSubmitButton } from "@/components/super-admin/products/atoms/ProductFormSubmitButton";
import { ProductFormErrorDisplay } from "@/components/super-admin/products/atoms/ProductFormErrorDisplay";

interface ProductFormFooterProps {
  isSubmitting: boolean;
  isEditMode: boolean;
  error: string | null;
  aiSeoEnabled: boolean;
}

export function ProductFormFooter({
  isSubmitting,
  isEditMode,
  error,
  aiSeoEnabled
}: ProductFormFooterProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-5 space-y-4">
      <ProductFormSubmitButton 
        isSubmitting={isSubmitting} 
        isEditMode={isEditMode} 
      />
      
      <ProductFormErrorDisplay error={error} />

      <p className="text-xs text-center text-muted-foreground">
        {aiSeoEnabled
          ? "Review all three steps above, then save once."
          : "Review product details and pricing, then save."}
      </p>
    </div>
  );
}