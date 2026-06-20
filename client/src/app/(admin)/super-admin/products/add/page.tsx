"use client";

import { Suspense } from "react";
import { ProductAddScreen } from "@/components/super-admin/products/screen/ProductAddScreen";
import { 
  Package, 
  Zap, 
  Sparkles, 
  Loader2,
  Grid3x3,
  Cpu,
  Binary,
  Orbit
} from "lucide-react";

export const dynamic = 'force-dynamic';

// ==================== MODULAR COMPONENTS ====================

// 1. Futuristic Loading Component
function FuturisticLoader() {
  return (
    <div className="min-h-screen bg-linear-to-br from-background via-card/50 to-background">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/5 animate-pulse" />
        <div className="absolute top-1/2 right-1/4 h-48 w-48 rounded-full bg-secondary/5 animate-pulse delay-300" />
        <div className="absolute bottom-1/4 left-1/3 h-32 w-32 rounded-full bg-accent/5 animate-pulse delay-700" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        {/* Logo/Icon with animation */}
        <div className="relative mb-8">
          <div className="h-24 w-24 rounded-2xl bg-linear-to-br from-primary via-secondary to-accent flex items-center justify-center animate-spin-slow">
            <div className="h-20 w-20 rounded-xl bg-background flex items-center justify-center">
              <Package className="h-10 w-10 text-primary" />
            </div>
          </div>
          
          {/* Orbiting dots */}
          <div className="absolute inset-0">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute h-3 w-3 rounded-full bg-primary animate-orbit"
                style={{
                  animationDelay: `${i * 0.5}s`,
                  top: '50%',
                  left: '50%',
                  transformOrigin: `0 100px`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Loading text with gradient */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-3 bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Initializing Product Matrix
          </h1>
          <p className="text-muted-foreground max-w-md">
            Preparing futuristic interface for product management
          </p>
        </div>

        {/* Loading progress */}
        <div className="w-full max-w-md space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Loading modules</span>
            <span className="font-medium text-primary">45%</span>
          </div>
          
          {/* Main progress bar */}
          <div className="h-2 bg-card rounded-full overflow-hidden">
            <div 
              className="h-full bg-linear-to-r from-primary via-secondary to-accent animate-shimmer"
              style={{ width: '45%' }}
            />
          </div>

          {/* Sub-progress indicators */}
          <div className="grid grid-cols-3 gap-2">
            {['Interface', 'Database', 'AI Tools'].map((module, i) => (
              <div key={module} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{module}</span>
                  {i === 0 ? (
                    <Loader2 className="h-3 w-3 text-primary animate-spin" />
                  ) : i === 1 ? (
                    <Sparkles className="h-3 w-3 text-secondary" />
                  ) : (
                    <Zap className="h-3 w-3 text-accent" />
                  )}
                </div>
                <div className="h-1 bg-card rounded-full overflow-hidden">
                  <div 
                    className={`h-full animate-pulse ${
                      i === 0 ? 'bg-primary' : 
                      i === 1 ? 'bg-secondary' : 
                      'bg-accent'
                    }`}
                    style={{ width: `${70 - i * 20}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading tips */}
        <div className="mt-8 p-4 glass-effect rounded-xl border border-glass-border max-w-md">
          <div className="flex items-center gap-3 mb-2">
            <Grid3x3 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">Pro Tip</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Our AI is optimizing your product form for maximum conversion. 
            Advanced features like holographic previews are being loaded.
          </p>
        </div>

        {/* Tech specs display */}
        <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            <span>Quantum Processor</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1">
            <Binary className="h-3 w-3" />
            <span>v2.4.1</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1">
            <Orbit className="h-3 w-3" />
            <span>64-bit Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. Error Boundary Component (for error handling)
function ProductFormErrorBoundary({ children }: { children: React.ReactNode }) {
  // In a real implementation, this would be a proper ErrorBoundary
  return <>{children}</>;
}

// ==================== MAIN COMPONENT ====================

function SuperAdminManageProductPage() {
  return (
    <ProductFormErrorBoundary>
      <Suspense fallback={<FuturisticLoader />}>
        <ProductAddScreen />
      </Suspense>
    </ProductFormErrorBoundary>
  );
}

export default SuperAdminManageProductPage;