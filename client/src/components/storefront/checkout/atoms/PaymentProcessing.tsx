// components/user/checkout/PaymentProcessing.tsx
import { Zap, Shield, CreditCard, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PaymentProcessingProps {
  progress?: number;
  message?: string;
}

export function PaymentProcessing({
  progress = 75,
  message = "Processing your payment securely...",
}: PaymentProcessingProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-sm">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="h-12 w-12 text-primary animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Securing Your Payment
          </h2>
          <p className="text-muted-foreground">
            {message}
          </p>
        </div>
        
        <Progress value={progress} className="w-full" />
        
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-success" />
            <span>Encrypted</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <span>PCI Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}