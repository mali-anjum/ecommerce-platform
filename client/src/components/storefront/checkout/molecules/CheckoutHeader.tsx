import { CheckoutProgress } from "@/components/storefront/checkout/molecules/CheckoutProgress";

interface CheckoutHeaderProps {
  itemsCount: number;
  currentStep: number;
}

export const CheckoutHeader = ({ itemsCount, currentStep }: CheckoutHeaderProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
        <span className="text-sm text-muted-foreground">
          {itemsCount} item{itemsCount !== 1 ? "s" : ""}
        </span>
      </div>
      <CheckoutProgress currentStep={currentStep} />
    </div>
  );
};