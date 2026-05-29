// "use client";

// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useProductStore } from "@/store/useProductStore";
// import { useProductFilters } from "@/hooks/useProductFilter";
// import { ProductFilters as FiltersComponent } from "@/components/products/ProductFilters";
// import { ProductGrid } from "@/components/products/ProductGrid";
// import { Pagination } from "@/components/products/ProductPagination";
// import { handleApiError } from "@/utils/errHandler";
// import { SlidersHorizontal } from "lucide-react";
// import { useEffect, useCallback } from "react";

// function ProductListingPage() {
//   const {
//     priceRange,
//     setPriceRange,
//     selectedCategories,
//     selectedSizes,
//     selectedColors,
//     selectedBrands,
//     sortBy,
//     sortOrder,
//     handleToggleFilter,
//     handleSortChange,
//     getFilters,
//   } = useProductFilters();

//   const {
//     products,
//     currentPage,
//     totalPages,
//     totalProducts,
//     setCurrentPage,
//     fetchProductsForClient,
//     isLoading,
//     error,
//   } = useProductStore();

//   // Use useCallback with proper dependencies
//   const fetchAllProducts = useCallback(() => {
//     const filters = getFilters();
//     fetchProductsForClient({
//       ...filters,
//       page: currentPage,
//       limit: 12, // Increased from 5 for better UX
//     });
//   }, [currentPage, getFilters, fetchProductsForClient]);

//   // Use useEffect with stable dependencies
//   useEffect(() => {
//     fetchAllProducts();
//   }, [fetchAllProducts, currentPage]); // Added currentPage as dependency

//   const handlePageChange = (newPage: number) => {
//     setCurrentPage(newPage);
//     // Scroll to top when page changes
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   // Add error boundary for 401 errors
//   useEffect(() => {
//     if (error) {
//       console.error('Product fetch error:', handleApiError(error));
//       // You might want to handle authentication errors here
//       if (error.includes('401') || error.includes('unauthorized')) {
//         // Redirect to login or show auth modal
//         console.warn('Authentication may be required');
//       }
//     }
//   }, [error]);

// // Add this inside your ProductListingPage component, before the return statement
// const DebugInfo = () => {
//   const { products, isLoading, error, currentPage, totalPages, totalProducts } = useProductStore();
  
//   console.log("🛠️ DEBUG - Current State:", {
//     products,
//     productsLength: products?.length,
//     isLoading,
//     error,
//     currentPage,
//     totalPages,
//     totalProducts
//   });

//   return (
//     <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs z-50 opacity-80">
//       <div>🛠️ DEBUG INFO:</div>
//       <div>Products: {products?.length || 0}</div>
//       <div>Loading: {isLoading.toString()}</div>
//       <div>Error: {error || 'none'}</div>
//       <div>Page: {currentPage}/{totalPages}</div>
//       <div>Total: {totalProducts}</div>
//     </div>
//   );
// };


//   return (
//     <div>
//     <div className="min-h-screen bg-white">
//       <div className="relative h-[300px] overflow-hidden">
//         <img
//           src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop"
//           alt="Listing Page Banner"
//           className="w-full object-cover h-full"
//         />
//         <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
//           <div className="text-center text-white">
//             <h1 className="text-4xl font-bold mb-2">HOT COLLECTION</h1>
//             <p className="text-lg">Discover our latest collection</p>
//           </div>
//         </div>
//       </div>
      
//       <div className="container mx-auto px-4 py-8">
//         <div className="flex items-center justify-between mb-8">
//           <h2 className="text-2xl font-semibold">All Products</h2>
//           <div className="flex items-center gap-4">
//             <Dialog>
//               <DialogTrigger asChild>
//                 <Button variant="outline" className="lg:hidden">
//                   <SlidersHorizontal className="h-4 w-4 mr-2" />
//                   Filters
//                 </Button>
//               </DialogTrigger>
//               <DialogContent className="w-[90vw] max-h-[600px] overflow-auto max-w-[400px]">
//                 <DialogHeader>
//                   <DialogTitle>Filters</DialogTitle>
//                 </DialogHeader>
//                 <FiltersComponent
//                   priceRange={priceRange}
//                   setPriceRange={setPriceRange}
//                   selectedCategories={selectedCategories}
//                   selectedSizes={selectedSizes}
//                   selectedColors={selectedColors}
//                   selectedBrands={selectedBrands}
//                   onToggleFilter={handleToggleFilter}
//                 />
//               </DialogContent>
//             </Dialog>
            
//             <Select
//               value={`${sortBy}-${sortOrder}`}
//               onValueChange={handleSortChange}
//             >
//               <SelectTrigger className="w-[180px]">
//                 <SelectValue placeholder="Sort by" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="createdAt-desc">Featured</SelectItem>
//                 <SelectItem value="price-asc">Price: Low to High</SelectItem>
//                 <SelectItem value="price-desc">Price: High to Low</SelectItem>
//                 <SelectItem value="createdAt-asc">Newest First</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </div>
        
//         <div className="flex gap-8">
//           <div className="hidden lg:block w-64 flex-shrink-0">
//             <FiltersComponent
//               priceRange={priceRange}
//               setPriceRange={setPriceRange}
//               selectedCategories={selectedCategories}
//               selectedSizes={selectedSizes}
//               selectedColors={selectedColors}
//               selectedBrands={selectedBrands}
//               onToggleFilter={handleToggleFilter}
//             />
//           </div>
          
//           <div className="flex-1">
//             <ProductGrid
//               products={products}
//               isLoading={isLoading}
//               error={error}
//             />
            
//             <Pagination
//               currentPage={currentPage}
//               totalPages={totalPages}
//               onPageChange={handlePageChange}
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//      <DebugInfo />
//      </div>
//   );
// }

// export default ProductListingPage;
"use client";

import { Button } from "@/components/ui/button";
import { useProductStore } from "@/store/useProductStore";
import { useProductFilters } from "@/hooks/useProductFilter";
import { ProductFilters as FiltersComponent } from "@/components/products/ProductFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Pagination } from "@/components/products/ProductPagination";
import { handleApiError } from "@/utils/errHandler";
import { 
  Zap, 
  Sparkles, 
  Grid3x3,
  TrendingUp,
  Star,
  Flame,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronDown,
  Eye,
  Target,
} from "lucide-react";
import { useEffect, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Maps UI tab ids to backend `collection` query (see productController.getProductsForClient). */
function toApiCollection(tab: string): string | undefined {
  if (tab === "all") return undefined;
  if (tab === "ai") return "featured";
  return tab;
}

// ==================== MODULAR COMPONENTS ====================

// 1. Hero Banner Component
function HeroBanner() {
  return (
    <div className="relative h-[400px] overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/5" />
        <img
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop"
          alt="Futuristic Collection"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
      </div>
      
      {/* Animated Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-primary animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Hero Content */}
      <div className="relative h-full flex items-center justify-center">
        <div className="text-center px-4 max-w-4xl">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 backdrop-blur-sm mb-4">
              <Flame className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">LIMITED TIME</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                NEXUS
              </span>
              <br />
              <span className="text-foreground">COLLECTION 2.0</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover the future of fashion with our AI-curated collection of futuristic designs
            </p>
          </div>

          {/* Hero Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="glass-effect rounded-xl p-4 min-w-[140px] border border-glass-border">
              <div className="text-2xl font-bold text-primary mb-1">500+</div>
              <div className="text-sm text-muted-foreground">Products</div>
            </div>
            <div className="glass-effect rounded-xl p-4 min-w-[140px] border border-glass-border">
              <div className="text-2xl font-bold text-secondary mb-1">24H</div>
              <div className="text-sm text-muted-foreground">Delivery</div>
            </div>
            <div className="glass-effect rounded-xl p-4 min-w-[140px] border border-glass-border">
              <div className="text-2xl font-bold text-accent mb-1">AI</div>
              <div className="text-sm text-muted-foreground">Curated</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. Collection Tabs — drives `/fetch-client-products?collection=` (featured / new / trending / bestsellers)
interface CollectionTabsProps {
  value: string;
  onChange: (id: string) => void;
  totalProducts: number;
}

function CollectionTabs({ value, onChange, totalProducts }: CollectionTabsProps) {
  const collections = [
    { id: "all", label: "All Products", icon: Grid3x3, badge: undefined as string | undefined },
    { id: "new", label: "New Arrivals", icon: Zap, badge: "HOT" },
    { id: "trending", label: "Trending", icon: TrendingUp, badge: undefined },
    { id: "bestsellers", label: "Bestsellers", icon: Star, badge: undefined },
    { id: "ai", label: "Featured", icon: Sparkles, badge: "★" },
  ];

  return (
    <div className="mb-8">
      <Tabs value={value} onValueChange={onChange} className="w-full">
        <TabsList className="glass-effect p-1 border border-glass-border w-full overflow-x-auto flex-nowrap">
          {collections.map((collection) => {
            const Icon = collection.icon;
            return (
              <TabsTrigger
                key={collection.id}
                value={collection.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 whitespace-nowrap"
              >
                <Icon className="h-4 w-4" />
                {collection.label}
                {collection.id === "all" && (
                  <Badge variant="outline" className="ml-2 border-border">
                    {totalProducts}
                  </Badge>
                )}
                {collection.badge && (
                  <Badge className="ml-1 bg-accent text-accent-foreground text-xs">
                    {collection.badge}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}

// 4. Results Summary Component
interface ResultsSummaryProps {
  isLoading: boolean;
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  showingProducts: number;
}

function ResultsSummary({
  isLoading,
  totalProducts,
  currentPage,
  totalPages,
  showingProducts
}: ResultsSummaryProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-foreground">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading Products...
            </div>
          ) : (
            <>
              {totalProducts} Futuristic Products
              <span className="text-sm text-muted-foreground block">
                Showing {showingProducts} of {totalProducts} items
              </span>
            </>
          )}
        </h3>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <div className="h-2 w-24 bg-card rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
            style={{
              width: `${totalPages ? (currentPage / Math.max(totalPages, 1)) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// 5. Error State Component
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-foreground">Error Loading Products</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Button onClick={onRetry} variant="outline" className="mt-2">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

function ProductListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mainCategoryQs = searchParams.get("mainCategory") ?? undefined;
  const subcategoryQs = searchParams.get("subcategory") ?? undefined;
  const urlSearchQs = searchParams.get("search") ?? "";

  const {
    priceRange,
    setPriceRange,
    selectedCategories,
    selectedSizes,
    selectedColors,
    selectedBrands,
    selectedConditions,
    selectedSellerIds,
    onDeal,
    minDiscount,
    setOnDeal,
    setMinDiscount,
    handleToggleFilter,
    getFilters,
    syncFromQuery,
    resetFilters,
    clearSelectedCategories,
  } = useProductFilters();

  const {
    products,
    currentPage,
    totalPages,
    totalProducts,
    availableSellers,
    setCurrentPage,
    fetchProductsForClient,
    isLoading,
    error,
  } = useProductStore();

  const [searchQuery, setSearchQuery] = useState(urlSearchQs);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [collectionTab, setCollectionTab] = useState("all");

  useEffect(() => {
    setSearchQuery(urlSearchQs);
  }, [urlSearchQs]);

  useEffect(() => {
    syncFromQuery(new URLSearchParams(searchParams.toString()));
  }, [searchParams, syncFromQuery]);

  useEffect(() => {
    clearSelectedCategories();
  }, [mainCategoryQs, subcategoryQs, clearSelectedCategories]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    collectionTab,
    debouncedSearch,
    mainCategoryQs,
    subcategoryQs,
    selectedConditions,
    selectedSellerIds,
    onDeal,
    minDiscount,
    setCurrentPage,
  ]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const setArray = (key: string, values: string[]) => {
      params.delete(key);
      if (values.length > 0) {
        params.set(key, values.join(","));
      }
    };

    setArray("conditions", selectedConditions);
    setArray("sellerIds", selectedSellerIds);

    if (onDeal) {
      params.set("onDeal", "true");
    } else {
      params.delete("onDeal");
    }

    if (minDiscount > 0) {
      params.set("minDiscount", String(minDiscount));
    } else {
      params.delete("minDiscount");
    }

    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      router.replace(next ? `/products?${next}` : "/products");
    }
  }, [
    minDiscount,
    onDeal,
    router,
    searchParams,
    selectedConditions,
    selectedSellerIds,
  ]);

  // Fetch products with filters + URL-driven department (`mainCategory`) + collection tabs
  const fetchAllProducts = useCallback(() => {
    const filters = getFilters();
    fetchProductsForClient({
      ...filters,
      categories:
        mainCategoryQs || subcategoryQs ? undefined : filters.categories,
      search: debouncedSearch || undefined,
      page: currentPage,
      limit: 12,
      mainCategory: mainCategoryQs,
      subcategory: subcategoryQs,
      collection: toApiCollection(collectionTab),
    });
  }, [
    currentPage,
    getFilters,
    fetchProductsForClient,
    debouncedSearch,
    mainCategoryQs,
    subcategoryQs,
    collectionTab,
  ]);

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts, currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetry = () => {
    fetchAllProducts();
  };

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("Product fetch error:", handleApiError(error));
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card/20">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Collection Tabs */}
        {(mainCategoryQs || subcategoryQs || urlSearchQs) && (
          <p className="text-sm text-muted-foreground mb-4">
            {mainCategoryQs && (
              <>Department: <span className="text-foreground font-medium">{decodeURIComponent(mainCategoryQs)}</span></>
            )}
            {subcategoryQs && (
              <> {" "}• Subcategory: <span className="text-foreground font-medium">{decodeURIComponent(subcategoryQs)}</span></>
            )}
            {urlSearchQs && (
              <> {" "}• Search: <span className="text-foreground font-medium">{decodeURIComponent(urlSearchQs)}</span></>
            )}
          </p>
        )}

        <CollectionTabs
          value={collectionTab}
          onChange={setCollectionTab}
          totalProducts={totalProducts}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-2xl border border-glass-border bg-card/70 p-4">
                <h3 className="mb-3 font-semibold">Filter Products</h3>
                <FiltersComponent
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  selectedCategories={selectedCategories}
                  selectedSizes={selectedSizes}
                  selectedColors={selectedColors}
                  selectedBrands={selectedBrands}
                  selectedConditions={selectedConditions}
                  selectedSellerIds={selectedSellerIds}
                  onDeal={onDeal}
                  minDiscount={minDiscount}
                  sellerOptions={availableSellers}
                  setOnDeal={setOnDeal}
                  setMinDiscount={setMinDiscount}
                  onToggleFilter={handleToggleFilter}
                  hideCategories={Boolean(mainCategoryQs || subcategoryQs)}
                />
              </div>
            </aside>
        <div>
            {/* Results Summary */}
            <ResultsSummary
              isLoading={isLoading}
              totalProducts={totalProducts}
              currentPage={currentPage}
              totalPages={totalPages}
              showingProducts={products?.length || 0}
            />

            {/* Error State */}
            {error ? (
              <ErrorState error={error} onRetry={handleRetry} />
            ) : (
              <>
                {/* Product Grid */}
                <ProductGrid
                  products={products}
                  isLoading={isLoading}
                  error={error}
                  // viewMode={viewMode}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}

                {/* Empty State */}
                {!isLoading && products.length === 0 && (
                  <div className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Target className="h-8 w-8 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-foreground">
                          No Products Found
                        </h3>
                        <p className="text-muted-foreground">
                          Try adjusting your filters or search term
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          resetFilters();
                          setSearchQuery("");
                          router.replace("/products");
                        }}
                        variant="outline"
                        className="mt-2"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Clear filters and department
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Load More - Alternative to Pagination */}
            {!isLoading && totalProducts > products.length && (
              <div className="text-center mt-8">
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  variant="outline"
                  className="border-border hover:border-primary"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Load More Products
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
        </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="fixed bottom-8 right-8 h-12 w-12 rounded-full shadow-lg z-50 glass-effect border-glass-border"
              size="icon"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Sparkles className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Back to top</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export default ProductListingPage;