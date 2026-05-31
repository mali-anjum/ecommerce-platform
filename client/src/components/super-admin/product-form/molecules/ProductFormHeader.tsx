import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import type { ReactNode } from "react";

type ProductFormHeaderProps = {
  isEditMode: boolean;
  onBackToList: () => void;
  listPathLabel?: string;
  rightSlot?: ReactNode;
};

export function ProductFormHeader({
  isEditMode,
  onBackToList,
  listPathLabel = "Back to List",
  rightSlot,
}: ProductFormHeaderProps) {
  return (
    <header className="glass-effect rounded-2xl p-6 mb-8 border border-glass-border">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            {isEditMode ? "Edit Product" : "Create New Product"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isEditMode
              ? "Update your futuristic product details"
              : "Add a new product to your futuristic collection"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={onBackToList}
            className="border-border hover:border-primary"
          >
            {listPathLabel}
          </Button>
          <div className="h-10 w-1 bg-border" />
          <span className="text-sm text-muted-foreground">
            {isEditMode ? "Edit Mode" : "Create Mode"}
          </span>
          {rightSlot}
        </div>
      </div>
    </header>
  );
}

