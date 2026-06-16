import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rocket, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";

export function CouponHeader() {
  const router = useRouter();
  return (
    <header className="glass-effect rounded-2xl p-6 mb-8 border border-glass-border">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center">
              <Ticket className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -inset-2 rounded-xl bg-primary/20 animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Create New Coupon
            </h1>
            <p className="text-muted-foreground">
              Design powerful discount codes for your futuristic store
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/super-admin/coupons/list")}
            className="border-border hover:border-primary"
          >
            View All Coupons
          </Button>
          <Badge variant="outline" className="border-primary text-primary">
            <Rocket className="h-3 w-3 mr-1" />
            Beta
          </Badge>
        </div>
      </div>
    </header>
  );
}
