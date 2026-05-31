import { Loader2 } from "lucide-react";

export type ProductsResultsSummaryProps = {
  isLoading: boolean;
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  showingProducts: number;
};

/** Count + pagination progress above the product grid. */
export function ProductsResultsSummary({
  isLoading,
  totalProducts,
  currentPage,
  totalPages,
  showingProducts,
}: ProductsResultsSummaryProps) {
  const progressPercent = totalPages
    ? (currentPage / Math.max(totalPages, 1)) * 100
    : 0;

  return (
    <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-foreground">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading Products...
            </div>
          ) : (
            <>
              {totalProducts} Futuristic Products
              <span className="block text-sm text-muted-foreground">
                Showing {showingProducts} of {totalProducts} items
              </span>
            </>
          )}
        </h3>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <div className="h-2 w-24 overflow-hidden rounded-full bg-card">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
