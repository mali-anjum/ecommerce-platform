import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export const CheckoutEmptyState = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 max-w-sm">
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Your cart is empty
          </h2>
          <p className="text-muted-foreground">
            Add some items to your cart before checking out
          </p>
        </div>
        <Button onClick={() => router.push("/")}>Continue Shopping</Button>
      </div>
    </div>
  );
};