import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ProductsFetchErrorStateProps = {
  error: string;
  onRetry: () => void;
};

/** Shown when the product fetch fails. */
export function ProductsFetchErrorState({ error, onRetry }: ProductsFetchErrorStateProps) {
  return (
    <div className="py-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-foreground">Error Loading Products</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Button onClick={onRetry} variant="outline" className="mt-2">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
