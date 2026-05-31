import { RefreshCw, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ProductsEmptyStateProps = {
  onClearFilters: () => void;
};

/** Shown when filters/search return zero products. */
export function ProductsEmptyState({ onClearFilters }: ProductsEmptyStateProps) {
  return (
    <div className="py-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Target className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-foreground">No Products Found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search term
          </p>
        </div>
        <Button onClick={onClearFilters} variant="outline" className="mt-2">
          <RefreshCw className="mr-2 h-4 w-4" />
          Clear filters and department
        </Button>
      </div>
    </div>
  );
}
