import { Binary, Cpu, CreditCard, Globe, Lock, Shield, Sparkles } from "lucide-react";

export function FuturisticCheckoutLoader() {
  return (
    <div className="min-h-screen bg-linear-to-br from-background via-card/50 to-background">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/5 animate-pulse" />
        <div className="absolute top-1/2 right-1/4 h-48 w-48 rounded-full bg-secondary/5 animate-pulse delay-300" />
        <div className="absolute bottom-1/4 left-1/3 h-32 w-32 rounded-full bg-accent/5 animate-pulse delay-700" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        {/* Secure Payment Icon */}
        <div className="relative mb-8">
          <div className="h-24 w-24 rounded-2xl bg-linear-to-br from-primary via-secondary to-accent flex items-center justify-center animate-spin-slow">
            <div className="h-20 w-20 rounded-xl bg-background flex items-center justify-center">
              <Lock className="h-10 w-10 text-primary" />
            </div>
          </div>
          
          {/* Security Ring Animation */}
          <div className="absolute inset-0">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute h-2 w-2 rounded-full bg-primary animate-orbit"
                style={{
                  animationDelay: `${i * 0.3}s`,
                  top: '50%',
                  left: '50%',
                  transformOrigin: `0 ${80 + i * 20}px`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-3 bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Initializing Secure Checkout
          </h1>
          <p className="text-muted-foreground max-w-md">
            Preparing your secure payment environment with military-grade encryption
          </p>
        </div>

        {/* Progress Indicators */}
        <div className="w-full max-w-md space-y-6">
          {/* Main Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Loading secure modules</span>
              <span className="font-medium text-primary">65%</span>
            </div>
            
            <div className="h-2 bg-card rounded-full overflow-hidden">
              <div 
                className="h-full bg-linear-to-r from-primary via-secondary to-accent animate-shimmer"
                style={{ width: '65%' }}
              />
            </div>
          </div>

          {/* Module Progress */}
          <div className="grid grid-cols-2 gap-4">
            {['Encryption', 'Payment Gateway', 'Security', 'Verification'].map((module, i) => (
              <div key={module} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{module}</span>
                  <div className={`h-2 w-2 rounded-full animate-pulse ${
                    i === 0 ? 'bg-primary' : 
                    i === 1 ? 'bg-secondary' : 
                    i === 2 ? 'bg-accent' : 
                    'bg-success'
                  }`} />
                </div>
                <div className="h-1 bg-card rounded-full overflow-hidden">
                  <div 
                    className={`h-full animate-pulse ${
                      i === 0 ? 'bg-primary' : 
                      i === 1 ? 'bg-secondary' : 
                      i === 2 ? 'bg-accent' : 
                      'bg-success'
                    }`}
                    style={{ width: `${60 + i * 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Security Badges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-effect rounded-lg p-3 border border-glass-border flex flex-col items-center">
              <Shield className="h-5 w-5 text-success mb-1" />
              <span className="text-xs text-muted-foreground">256-bit SSL</span>
            </div>
            <div className="glass-effect rounded-lg p-3 border border-glass-border flex flex-col items-center">
              <Lock className="h-5 w-5 text-primary mb-1" />
              <span className="text-xs text-muted-foreground">PCI DSS</span>
            </div>
            <div className="glass-effect rounded-lg p-3 border border-glass-border flex flex-col items-center">
              <CreditCard className="h-5 w-5 text-secondary mb-1" />
              <span className="text-xs text-muted-foreground">3D Secure</span>
            </div>
          </div>
        </div>

        {/* Loading Tips */}
        <div className="mt-8 p-4 glass-effect rounded-xl border border-glass-border max-w-md">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">Security Check</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Our AI is performing real-time security checks and fraud prevention.
            Your payment is protected by our futuristic security protocols.
          </p>
        </div>

        {/* Tech Specs */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            <span>Global Payments</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            <span>AI Fraud Detection</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1">
            <Binary className="h-3 w-3" />
            <span>Quantum Encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}