import { Check } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const getStrength = (pass: string) => {
    if (pass.length >= 16) return 3;
    if (pass.length >= 12) return 2;
    if (pass.length >= 6) return 1;
    return 0;
  };

  const strength = getStrength(password);
  const strengthLabels = ["Too Short", "Acceptable", "Good", "Strong"];
  const strengthColors = [
    "bg-destructive",
    "bg-yellow-500",
    "bg-green-500",
    "bg-emerald-500",
  ];

  if (!password) return null;

  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Password Strength</span>
        <span className={`font-medium ${
          strength >= 2 ? 'text-emerald-500' : 
          strength >= 1 ? 'text-yellow-500' : 'text-destructive'
        }`}>
          {strengthLabels[strength]}
        </span>
      </div>
      
      <div className="h-2 rounded-full bg-card overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${strengthColors[strength]}`}
          style={{ width: `${(strength / 3) * 100}%` }}
        />
      </div>
      
      <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
        <div className={`flex items-center gap-1 ${password.length >= 6 ? 'text-emerald-500' : ''}`}>
          {password.length >= 6 ? 
            <Check className="w-3 h-3" /> : 
            <span className="w-1 h-1 rounded-full bg-current" />
          }
          <span>At least 6 characters</span>
        </div>
      </div>
    </div>
  );
};