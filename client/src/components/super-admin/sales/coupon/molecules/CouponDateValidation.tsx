import { AlertCircle, CheckCircle } from "lucide-react";

interface DateValidationProps {
  startDate: string;
  endDate: string;
}

export function DateValidation({ startDate, endDate }: DateValidationProps) {
  if (!startDate || !endDate) return null;

  const isValid = new Date(endDate) > new Date(startDate);
  const daysValid = Math.floor(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 
    (1000 * 60 * 60 * 24)
  );

  return (
    <div className={`p-3 rounded-lg ${isValid ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
      <div className="flex items-center gap-2">
        {isValid ? (
          <CheckCircle className="h-4 w-4 text-success" />
        ) : (
          <AlertCircle className="h-4 w-4 text-destructive" />
        )}
        <div>
          <p className={`text-sm font-medium ${isValid ? 'text-success' : 'text-destructive'}`}>
            {isValid 
              ? `Valid for ${daysValid} days` 
              : 'End date must be after start date'
            }
          </p>
          <p className="text-xs text-muted-foreground">
            {isValid 
              ? 'Coupon schedule is properly configured'
              : 'Please adjust your dates'
            }
          </p>
        </div>
      </div>
    </div>
  );
}