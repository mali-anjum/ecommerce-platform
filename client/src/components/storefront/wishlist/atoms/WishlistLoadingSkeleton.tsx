import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function WishlistLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <div className="flex-1 space-y-0">
        <Card className="glass-effect overflow-hidden border border-glass-border">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex gap-4 border-b border-border/60 p-4 last:border-0"
            >
              <Skeleton className="h-24 w-24 shrink-0 rounded-lg sm:h-28 sm:w-28" />
              <div className="flex flex-1 flex-col gap-3 py-1">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-9 w-32" />
              </div>
            </div>
          ))}
        </Card>
      </div>
      <div className="lg:w-96">
        <Card className="glass-effect border border-glass-border">
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
