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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductStore } from "@/store/useProductStore";
import { useProductFilters } from "@/hooks/useProductFilter";
import { ProductFilters as FiltersComponent } from "@/components/products/ProductFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Pagination } from "@/components/products/ProductPagination";
import { handleApiError } from "@/utils/errHandler";
import { 
  SlidersHorizontal, 
  Zap, 
  Sparkles, 
  Filter, 
  Grid3x3,
  ListFilter,
  TrendingUp,
  Star,
  Flame,
  Search,
  X,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronDown,
  Eye,
  ShoppingBag,
  Target,
  BarChart3
} from "lucide-react";
import { useEffect, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

// 2. Filters Bar Component
interface FiltersBarProps {
  sortBy: string;
  sortOrder: string;
  onSortChange: (value: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilterCount: number;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  priceRange: number[];
  setPriceRange: (range: number[]) => void;
  selectedCategories: string[];
  selectedSizes: string[];
  selectedColors: string[];
  selectedBrands: string[];
  onToggleFilter: ProductFiltersToggle;
}

type ProductFiltersToggle = (
  filterType: "categories" | "sizes" | "brands" | "colors",
  value: string
) => void;

function FiltersBar({
  sortBy,
  sortOrder,
  onSortChange,
  searchQuery,
  onSearchChange,
  activeFilterCount,
  viewMode,
  onViewModeChange,
  priceRange,
  setPriceRange,
  selectedCategories,
  selectedSizes,
  selectedColors,
  selectedBrands,
  onToggleFilter,
}: FiltersBarProps) {
  return (
    <div className="glass-effect rounded-2xl p-4 border border-glass-border mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search futuristic products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-input border-border focus:ring-primary/50"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-card rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className={viewMode === "grid" ? "bg-primary text-primary-foreground" : ""}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className={viewMode === "list" ? "bg-primary text-primary-foreground" : ""}
            >
              <ListFilter className="h-4 w-4" />
            </Button>
          </div>

          {/* Sort Select */}
          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={onSortChange}
          >
            <SelectTrigger className="w-[180px] bg-input border-border">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="createdAt-desc">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-primary" />
                  Featured
                </div>
              </SelectItem>
              <SelectItem value="price-asc">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-secondary" />
                  Price: Low to High
                </div>
              </SelectItem>
              <SelectItem value="price-desc">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  Price: High to Low
                </div>
              </SelectItem>
              <SelectItem value="createdAt-asc">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Newest First
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Filters Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-border hover:border-primary">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 bg-primary text-primary-foreground">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-h-[600px] overflow-auto max-w-[400px] glass-effect border-glass-border">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary" />
                  Advanced Filters
                </DialogTitle>
              </DialogHeader>
              <FiltersComponent
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                selectedCategories={selectedCategories}
                selectedSizes={selectedSizes}
                selectedColors={selectedColors}
                selectedBrands={selectedBrands}
                onToggleFilter={onToggleFilter}
              />
            </DialogContent>
          </Dialog>
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
  const searchParams = useSearchParams();
  const mainCategoryQs = searchParams.get("mainCategory") ?? undefined;

  const {
    priceRange,
    setPriceRange,
    selectedCategories,
    selectedSizes,
    selectedColors,
    selectedBrands,
    sortBy,
    sortOrder,
    handleToggleFilter,
    handleSortChange,
    getFilters,
    resetFilters,
  } = useProductFilters();

  const {
    products,
    currentPage,
    totalPages,
    totalProducts,
    setCurrentPage,
    fetchProductsForClient,
    isLoading,
    error,
  } = useProductStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [collectionTab, setCollectionTab] = useState("all");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [collectionTab, debouncedSearch, mainCategoryQs, setCurrentPage]);

  // Fetch products with filters + URL-driven department (`mainCategory`) + collection tabs
  const fetchAllProducts = useCallback(() => {
    fetchProductsForClient({
      ...getFilters(),
      search: debouncedSearch || undefined,
      page: currentPage,
      limit: 12,
      mainCategory: mainCategoryQs,
      collection: toApiCollection(collectionTab),
    });
  }, [
    currentPage,
    getFilters,
    fetchProductsForClient,
    debouncedSearch,
    mainCategoryQs,
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

  // Calculate active filter count
  const activeFilterCount =
    [
      ...selectedCategories,
      ...selectedSizes,
      ...selectedColors,
      ...selectedBrands,
    ].length + (priceRange[0] > 0 || priceRange[1] < 100000 ? 1 : 0);

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
        {mainCategoryQs && (
          <p className="text-sm text-muted-foreground mb-4">
            Department filter: <span className="text-foreground font-medium">{decodeURIComponent(mainCategoryQs)}</span>
          </p>
        )}

        <CollectionTabs
          value={collectionTab}
          onChange={setCollectionTab}
          totalProducts={totalProducts}
        />

        {/* Filters Bar */}
        <FiltersBar
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilterCount={activeFilterCount}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          selectedCategories={selectedCategories}
          selectedSizes={selectedSizes}
          selectedColors={selectedColors}
          selectedBrands={selectedBrands}
          onToggleFilter={handleToggleFilter}
        />

        {/* Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <Card className="glass-effect border border-glass-border sticky top-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Filter className="h-5 w-5 text-primary" />
                    Filters
                  </h3>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        resetFilters();
                        setSearchQuery("");
                      }}
                      className="text-primary hover:text-primary-light"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>
                
                <FiltersComponent
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  selectedCategories={selectedCategories}
                  selectedSizes={selectedSizes}
                  selectedColors={selectedColors}
                  selectedBrands={selectedBrands}
                  onToggleFilter={handleToggleFilter}
                />
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="glass-effect border border-glass-border mt-4">
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Collection Stats
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">New Arrivals</span>
                      <span className="font-medium text-foreground">24</span>
                    </div>
                    <Progress value={80} className="h-1" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Trending</span>
                      <span className="font-medium text-foreground">42</span>
                    </div>
                    <Progress value={65} className="h-1" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">AI Picks</span>
                      <span className="font-medium text-foreground">12</span>
                    </div>
                    <Progress value={90} className="h-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
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
                          setSearchQuery("");
                          // Reset filters
                        }}
                        variant="outline"
                        className="mt-2"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset Filters
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