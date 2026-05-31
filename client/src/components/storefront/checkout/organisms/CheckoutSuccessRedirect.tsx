import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CheckoutSuccessRedirectProps {
  orderId?: string;
  delay?: number;
}

export const CheckoutSuccessRedirect = ({ 
  orderId, 
  delay = 3000 
}: CheckoutSuccessRedirectProps) => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (orderId) {
        router.push(`/orders/${orderId}`);
      } else {
        router.push('/orders');
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [router, orderId, delay]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 max-w-sm">
        <div className="h-24 w-24 rounded-full bg-success/20 flex items-center justify-center mx-auto">
          <CheckCircle className="h-12 w-12 text-success" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            🎉 Order Confirmed!
          </h2>
          <p className="text-muted-foreground">
            Your order has been placed successfully. Redirecting to order details...
          </p>
          {orderId && (
            <p className="text-sm text-muted-foreground mt-2">
              Order ID: <span className="font-mono">{orderId}</span>
            </p>
          )}
        </div>
        <div className="space-y-3">
          <Button 
            onClick={() => router.push('/orders')}
            className="w-full"
          >
            View My Orders
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="w-full"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
};