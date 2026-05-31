export interface PaymentFlowProps {
  showPaymentFlow: boolean;
  checkoutEmail: string;
  onEmailChange: (email: string) => void;
  onProceedToPayment: () => Promise<void>;
  onPayPalSuccess: (data: any) => Promise<void>;
  onCreatePayPalOrder: () => Promise<string | null>;
  isProcessing: boolean;
}