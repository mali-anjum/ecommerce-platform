import { ChevronDown, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ProductsLoadMoreButtonProps = {
  onLoadMore: () => void;
};

/** Optional load-more control below the grid (alternative to pagination). */
export function ProductsLoadMoreButton({ onLoadMore }: ProductsLoadMoreButtonProps) {
  return (
    <div className="mt-8 text-center">
      <Button
        onClick={onLoadMore}
        variant="outline"
        className="border-border hover:border-primary"
      >
        <Eye className="mr-2 h-4 w-4" />
        Load More Products
        <ChevronDown className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
