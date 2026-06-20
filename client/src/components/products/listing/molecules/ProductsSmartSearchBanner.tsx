import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ProductsSmartSearchBannerProps = {
  query: string;
  intentSummary: string;
  maxPrice?: number;
};

export function ProductsSmartSearchBanner({
  query,
  intentSummary,
  maxPrice,
}: ProductsSmartSearchBannerProps) {
  return (
    <div className="mb-6 rounded-xl border border-primary/25 bg-primary/5 p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium text-foreground">AI understood your search</p>
          <p className="text-sm text-muted-foreground">
            &ldquo;{query}&rdquo; → <span className="text-foreground">{intentSummary}</span>
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="secondary">Smart search</Badge>
            {maxPrice != null ? (
              <Badge variant="outline">Under ${maxPrice}</Badge>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
