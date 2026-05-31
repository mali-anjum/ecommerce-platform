import { Rocket } from "lucide-react";

interface WarmupStatusProps {
  isWarming: boolean;
}

export const WarmupStatus = ({ isWarming }: WarmupStatusProps) => (
  <div className={`mb-6 transition-all duration-500 ${isWarming ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
    <div className="rounded-xl p-4 glass-effect border-glass-border neon-border">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
          <Rocket className="w-4 h-4 text-white animate-float" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">🚀 Initializing Systems</p>
          <p className="text-sm text-muted-foreground">Optimizing your experience...</p>
        </div>
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 h-1 rounded-full bg-card overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-primary via-secondary to-accent animate-shimmer rounded-full" />
      </div>
    </div>
  </div>
);