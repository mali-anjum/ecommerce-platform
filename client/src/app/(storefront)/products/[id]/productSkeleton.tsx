// "use client";

// import { Skeleton } from "@/components/ui/skeleton";

// function ProductDetailsSkeleton() {
//   return (
//     <div className="min-h-screen bg-white">
//       <div className="container mx-auto px-4 py-8">
//         <div className="flex flex-col lg:flex-row gap-8">
//           <div className="lg:w-2/3 flex gap-4">
//             <div className="hidden lg:flex flex-col gap-2 w-24">
//               {[...Array(4)].map((_, index) => (
//                 <Skeleton key={index} className="w-24 h-24" />
//               ))}
//             </div>
//             <Skeleton className="flex-1 aspect-[3/4]" />
//           </div>
//           <div className="lg:w-1/3 space-y-6">
//             <div>
//               <Skeleton className="h-8 w-2/4 mb-2" />
//               <Skeleton className="h-6 w-1/4" />
//             </div>
//             <div>
//               <Skeleton className="h-4 w-1/4 mb-2" />
//               <div className="flex gap-2">
//                 {[...Array(4)].map((_, index) => (
//                   <Skeleton key={index} className="w-12 h-12 rounded-full" />
//                 ))}
//               </div>
//             </div>
//             <div>
//               <Skeleton className="h-4 w-1/4 mb-2" />
//               <div className="flex gap-2">
//                 {[...Array(5)].map((_, index) => (
//                   <Skeleton key={index} className="w-12 h-12" />
//                 ))}
//               </div>
//             </div>
//             <div>
//               <Skeleton className="h-5 w-1/4 mb-2" />
//               <div className="flex gap-3">
//                 <Skeleton className="w-10 h-10" />
//                 <Skeleton className="w-10 h-10" />
//                 <Skeleton className="w-10 h-10" />
//               </div>
//             </div>
//             <div>
//               <Skeleton className="h-12 w-full" />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default ProductDetailsSkeleton;
"use client";

import { Skeleton } from "@/components/ui/skeleton";

// Modular Skeleton Components
const ImageGallerySkeleton = () => (
  <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
    {/* Thumbnail strip skeleton */}
    <div className="hidden lg:flex flex-col gap-3 w-20">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="relative">
          <Skeleton className="w-20 h-20 rounded-lg" />
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-glass/20 to-transparent animate-shimmer" />
        </div>
      ))}
    </div>

    {/* Main image skeleton */}
    <div className="flex-1 relative">
      <div className="relative rounded-2xl overflow-hidden">
        <Skeleton className="w-full aspect-[3/4] rounded-2xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-glass/10 to-transparent animate-shimmer" />
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl border border-primary/10 shadow-lg shadow-primary/5" />
      </div>

      {/* Mobile thumbnails skeleton */}
      <div className="flex lg:hidden gap-3 mt-4 pb-2">
        {[...Array(4)].map((_, index) => (
          <Skeleton key={index} className="w-16 h-16 rounded-lg" />
        ))}
      </div>
    </div>
  </div>
);

const ColorSelectorSkeleton = () => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <Skeleton className="w-2 h-2 rounded-full" />
      <Skeleton className="h-4 w-16" />
    </div>
    <div className="flex flex-wrap gap-3">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="relative">
          <Skeleton className="w-14 h-14 rounded-full" />
          <div className="absolute inset-0 rounded-full border-2 border-background/10" />
        </div>
      ))}
    </div>
  </div>
);

const SizeSelectorSkeleton = () => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <Skeleton className="w-2 h-2 rounded-full" />
      <Skeleton className="h-4 w-16" />
    </div>
    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
      {[...Array(6)].map((_, index) => (
        <Skeleton key={index} className="h-12 rounded-lg" />
      ))}
    </div>
  </div>
);

const QuantitySelectorSkeleton = () => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <Skeleton className="w-2 h-2 rounded-full" />
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="flex items-center gap-3">
      <Skeleton className="w-12 h-12 rounded-lg" />
      <div className="w-16 h-12 rounded-lg glass-effect">
        <div className="h-full flex items-center justify-center">
          <Skeleton className="w-8 h-6" />
        </div>
      </div>
      <Skeleton className="w-12 h-12 rounded-lg" />
    </div>
  </div>
);

const ProductInfoSkeleton = () => (
  <div className="space-y-4">
    {/* Rating skeleton */}
    <div className="flex items-center gap-2 mb-2">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-4 h-4 rounded-sm" />
        ))}
      </div>
      <Skeleton className="h-3 w-20" />
    </div>

    {/* Title skeleton */}
    <Skeleton className="h-10 w-3/4 mb-3" />

    {/* Price skeleton */}
    <div className="flex items-center gap-4">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-12 rounded-full" />
    </div>

    {/* Description skeleton */}
    <div className="space-y-2 pt-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/4" />
    </div>

    {/* Features skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-3 rounded-lg glass-effect">
          <Skeleton className="w-5 h-5 rounded-full" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ProductTabsSkeleton = () => (
  <div className="mt-12 md:mt-16">
    {/* Tabs header skeleton */}
    <div className="flex gap-2 border-b border-border pb-2">
      {[...Array(4)].map((_, index) => (
        <Skeleton key={index} className="h-10 w-32 rounded-t-lg" />
      ))}
    </div>

    {/* Tab content skeleton */}
    <div className="mt-8">
      <div className="rounded-xl p-6 md:p-8 glass-effect border-glass-border">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-10/12" />
          <Skeleton className="h-4 w-9/12" />
          <Skeleton className="h-4 w-full mt-4" />
        </div>
      </div>
    </div>
  </div>
);

const FloatingButtonsSkeleton = () => (
  <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-20">
    <Skeleton className="w-12 h-12 rounded-full" />
    <Skeleton className="w-12 h-12 rounded-full" />
  </div>
);

// Main Skeleton Component
function ProductDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground theme-transition">
      {/* Background effects for skeleton */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="error-grid absolute inset-0 opacity-5" />
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="error-particle absolute animate-digital-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDelay: `${Math.random() * 2}s`,
              '--particle-opacity': '0.05',
              '--particle-blur': '1px',
            } as any}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-8">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <Skeleton className="h-4 w-12" />
              {index < 3 && <Skeleton className="h-3 w-2" />}
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Column - Images skeleton */}
          <div className="lg:w-1/2">
            <ImageGallerySkeleton />
          </div>

          {/* Right Column - Product Info skeleton */}
          <div className="lg:w-1/2">
            <ProductInfoSkeleton />

            <div className="space-y-8 mt-8">
              <ColorSelectorSkeleton />
              <SizeSelectorSkeleton />
              <QuantitySelectorSkeleton />

              {/* Action buttons skeleton */}
              <div className="space-y-4 pt-6 border-t border-border">
                <Skeleton className="w-full h-14 rounded-xl" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-14 rounded-xl" />
                  <Skeleton className="h-14 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs skeleton */}
        <ProductTabsSkeleton />

        {/* Floating buttons skeleton */}
        <FloatingButtonsSkeleton />
      </div>

      {/* Shimmer overlay for futuristic effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-glass/5 to-transparent animate-shimmer" />
      </div>
    </div>
  );
}

export default ProductDetailsSkeleton;