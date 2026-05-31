import { Zap, Shield, Rocket } from "lucide-react";

export const FeaturesGrid = () => (
  <div className="mt-8 md:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
    <div className="text-center p-2 md:p-3 rounded-lg glass-effect border-glass-border hover:scale-105 transition-transform duration-300">
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
        <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary" />
      </div>
      <p className="text-xs md:text-sm text-muted-foreground">Lightning Fast</p>
    </div>
    <div className="text-center p-2 md:p-3 rounded-lg glass-effect border-glass-border hover:scale-105 transition-transform duration-300">
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-2">
        <Shield className="w-4 h-4 md:w-5 md:h-5 text-secondary" />
      </div>
      <p className="text-xs md:text-sm text-muted-foreground">Bank-Level Security</p>
    </div>
    <div className="text-center p-2 md:p-3 rounded-lg glass-effect border-glass-border hover:scale-105 transition-transform duration-300">
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
        <Rocket className="w-4 h-4 md:w-5 md:h-5 text-accent" />
      </div>
      <p className="text-xs md:text-sm text-muted-foreground">Modern Interface</p>
    </div>
  </div>
);