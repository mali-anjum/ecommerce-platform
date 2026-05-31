import { Button } from "@/components/ui/button";
import { Zap, ArrowRight } from "lucide-react";

interface LoadingButtonProps {
  isLoading: boolean;
  isWarming?: boolean;
  variant?: 'login' | 'register';
}

export const LoadingButton = ({ isLoading, isWarming = false, variant = 'login' }: LoadingButtonProps) => {
  const getContent = () => {
    if (isLoading || isWarming) {
      return (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {isWarming ? "INITIALIZING..." : variant === 'register' ? "CREATING ACCOUNT..." : "AUTHENTICATING..."}
        </>
      );
    }
    
    return variant === 'register' ? (
      <>
        CREATE ACCOUNT
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </>
    ) : (
      <>
        <Zap className="w-4 h-4" />
        ACCESS SYSTEM
      </>
    );
  };

  return (
    <Button
      type="submit"
      className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary-light neon-border hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden"
      disabled={isLoading || isWarming}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {getContent()}
      </span>
      {!isLoading && !isWarming && variant === 'register' && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
      )}
      {(isLoading || isWarming) && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent animate-shimmer" />
      )}
    </Button>
  );
};