"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductFormSubmitButtonProps {
  isSubmitting: boolean;
  isEditMode: boolean;
  className?: string;
}

export function ProductFormSubmitButton({ 
  isSubmitting, 
  isEditMode,
  className 
}: ProductFormSubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      className={cn(
        "w-full py-6 text-lg font-semibold rounded-xl",
        className
      )}
    >
      {isSubmitting ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          {isEditMode ? "Updating product…" : "Creating product…"}
        </span>
      ) : (
        isEditMode ? "Save changes" : "Create product"
      )}
    </Button>
  );
}