import { CheckCircle, CreditCard, MapPin, ShoppingBag } from "lucide-react";


export function CheckoutProgress({ currentStep }: { currentStep: number }) {
  const steps = [
    { label: "Cart", icon: ShoppingBag },
    { label: "Delivery", icon: MapPin },
    { label: "Payment", icon: CreditCard },
    { label: "Confirm", icon: CheckCircle },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-card -translate-y-1/2 -z-10">
          <div 
            className="h-full bg-linear-to-r from-primary via-secondary to-accent transition-all duration-500"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>
        
        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const StepIcon = step.icon;
          
          return (
            <div key={step.label} className="flex flex-col items-center">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isCompleted 
                  ? 'bg-linear-to-r from-primary to-secondary' 
                  : isCurrent 
                  ? 'bg-primary ring-4 ring-primary/20' 
                  : 'bg-card border-2 border-border'
              }`}>
                <StepIcon className={`h-5 w-5 ${
                  isCompleted || isCurrent ? 'text-white' : 'text-muted-foreground'
                }`} />
              </div>
              <span className={`mt-2 text-sm font-medium ${
                isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
              {isCurrent && (
                <div className="mt-1">
                  <div className="h-1 w-8 rounded-full bg-linear-to-r from-primary to-secondary animate-pulse" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}