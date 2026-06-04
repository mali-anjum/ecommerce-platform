
import { Suspense } from "react";
import ProductDetailsSkeleton from "./productSkeleton";
import ProductDetailsContent from "./productDetails";
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { sentryTracker } from "@/lib/monitoring";

// Optional: Generate metadata for the page
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  try {
    const { id } = await params;
    return {
      title: `Product ${id} | Futuristic Store`,
      description: 'Explore cutting-edge products with futuristic design',
      openGraph: {
        title: `Product ${id}`,
        description: 'Experience the future of shopping',
        type: 'website',
      },
    };
  } catch {
    return {
      title: 'Product Details | Futuristic Store',
      description: 'Explore our cutting-edge products',
    };
  }
}

// Error Boundary Component for better error handling
function ProductDetailsErrorBoundary({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <div className="relative">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="error-grid absolute inset-0 opacity-10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary to-transparent animate-pulse" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-secondary to-transparent animate-pulse animation-delay-1000" />
      </div>
      
      {/* Hologram effect overlay */}
      <div className="hologram-effect fixed inset-0 opacity-5 pointer-events-none" />
      
      {children}
    </div>
  );
}

// Loading wrapper with enhanced effects
function EnhancedSuspenseFallback() {
  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Futuristic loading animation */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-transparent border-t-primary border-r-secondary border-b-accent border-l-primary-light animate-spin-slow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-primary/20 to-secondary/20 animate-pulse" />
          </div>
          <div className="absolute -inset-4 rounded-full border border-primary/10 animate-ping" />
        </div>
        
        {/* Loading text with glow effect */}
        <div className="absolute bottom-0 translate-y-16 text-center">
          <p className="text-muted-foreground text-lg font-medium mb-2">
            INITIALIZING PRODUCT DATA
          </p>
          <div className="flex items-center justify-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Product Details Page Component
export default async function ProductDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  try {
    const { id } = await params;
    
    // Enhanced ID validation with futuristic error messages
    if (!id || typeof id !== 'string') {
      console.error('🚫 Invalid product ID detected');
      notFound();
    }
    
    // Optional: Add analytics or logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Loading product: ${id}`);
    }
    
    return (
      <ProductDetailsErrorBoundary>
        <Suspense 
          fallback={
            <div className="relative">
              {/* Animated background for loading state */}
              <div className="absolute inset-0 bg-linear-to-br from-background via-card to-background animate-gradient-shift" />
              <ProductDetailsSkeleton />
            </div>
          }
        >
          <ProductDetailsContent id={id} />
        </Suspense>
      </ProductDetailsErrorBoundary>
    );
  } catch (error) {
    sentryTracker(error, { source: "page" });
    // Enhanced error handling with futuristic logging
    console.error('⚡ Error in ProductDetailsPage:', error);
    
    // Log to analytics service (if available)
    if (typeof window !== 'undefined') {
      // You can add your analytics tracking here
      console.log('📊 Error tracked:', {
        type: 'product_page_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
    
    notFound();
  }
}

// Add custom CSS for new animations
const styles = `
  @keyframes gradient-shift {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }
  
  .animate-gradient-shift {
    background-size: 200% 200%;
    animation: gradient-shift 15s ease infinite;
  }
  
  .animation-delay-1000 {
    animation-delay: 1s;
  }
  
  .animation-delay-2000 {
    animation-delay: 2s;
  }
`;

// Inject styles (you can also add this to your global CSS)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}