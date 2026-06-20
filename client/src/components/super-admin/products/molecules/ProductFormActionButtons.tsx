"use client";

import { Button } from "@/components/ui/button";

interface ProductFormActionButtonsProps {
  isSubmitting: boolean;
  isEditMode: boolean;
  onCancel?: () => void;
  onSubmit: () => void;
}

export function ProductFormActionButtons({
  isSubmitting,
  isEditMode,
  onCancel,
  onSubmit
}: ProductFormActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      )}
      <Button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="flex-1 py-6 text-lg font-semibold rounded-xl"
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
    </div>
  );
}