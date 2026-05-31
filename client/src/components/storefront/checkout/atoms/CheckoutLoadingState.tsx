import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CheckoutLoadingStateProps {
  message?: string;
  showProgress?: boolean;
}

export const CheckoutLoadingState = ({ 
  message = "Loading your checkout...", 
  showProgress = true 
}: CheckoutLoadingStateProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 max-w-sm">
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Preparing Checkout
          </h2>
          <p className="text-muted-foreground">{message}</p>
        </div>
        
        {showProgress && (
          <Card className="glass-effect">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Loading cart items...</span>
                  <span>✓</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Fetching addresses...</span>
                  <span>⌛</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Applying discounts...</span>
                  <span>⌛</span>
                </div>
              </div>
              <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};