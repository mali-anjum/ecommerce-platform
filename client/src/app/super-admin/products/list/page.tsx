"use client";

import { ProductTableSkeleton } from "@/components/products/ProductTableSkeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useProductStore } from "@/store/useProductStore";
import { 
  Pencil, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Zap, 
  Sparkles,
  TrendingUp,
  Package,
  DollarSign,
  Hash,
  Tag,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// ==================== MODULAR COMPONENTS ====================

// 1. Product Card Component (for mobile/alternative view)
interface ProductCardProps {
  product: any;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

function ProductCard({ product, onEdit, onDelete, onView }: ProductCardProps) {
  return (
    <div className="glass-effect rounded-xl border border-glass-border p-4 space-y-3">
      {/* Product Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Product Image */}
          <div className="relative">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
              {product.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            {/* Stock Indicator */}
            <div className={`absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-card ${
              product.stock > 10 ? 'bg-success' : 
              product.stock > 0 ? 'bg-warning' : 
              'bg-destructive'
            }`} />
          </div>
          
          {/* Product Info */}
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground line-clamp-1">
              {product.name}
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {product.category || 'Uncategorized'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                ID: {product.id.slice(0, 8)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(product.id)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(product.id)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(product.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Product Details */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            Price
          </div>
          <p className="text-lg font-bold text-primary">
            ${product.price?.toFixed(2) || '0.00'}
          </p>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Hash className="h-3 w-3" />
            Stock
          </div>
          <p className={`text-lg font-semibold ${
            product.stock > 10 ? 'text-success' : 
            product.stock > 0 ? 'text-warning' : 
            'text-destructive'
          }`}>
            {product.stock || 0}
          </p>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Tag className="h-3 w-3" />
          Sizes: {product.sizes?.slice(0, 2).join(', ')} {product.sizes?.length > 2 && '...'}
        </div>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={() => onEdit(product.id)}
          className="text-primary hover:text-primary-light"
        >
          <Pencil className="h-3 w-3 mr-1" />
          Edit
        </Button>
      </div>
    </div>
  );
}

// 2. Status Badge Component
interface StatusBadgeProps {
  stock: number;
}

function StatusBadge({ stock }: StatusBadgeProps) {
  if (stock > 10) {
    return (
      <Badge className="bg-success/20 text-success border-success/20">
        <CheckCircle className="h-3 w-3 mr-1" />
        In Stock
      </Badge>
    );
  }
  if (stock > 0) {
    return (
      <Badge className="bg-warning/20 text-warning border-warning/20">
        <AlertCircle className="h-3 w-3 mr-1" />
        Low Stock
      </Badge>
    );
  }
  return (
    <Badge className="bg-destructive/20 text-destructive border-destructive/20">
      <XCircle className="h-3 w-3 mr-1" />
      Out of Stock
    </Badge>
  );
}

// 3. Stats Overview Component
function StatsOverview({ products }: { products: any[] }) {
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  const stats = [
    {
      label: "Total Products",
      value: totalProducts,
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Total Value",
      value: `$${totalValue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      label: "Low Stock",
      value: lowStock,
      icon: AlertCircle,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Out of Stock",
      value: outOfStock,
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className="glass-effect rounded-xl p-4 border border-glass-border"
        >
          <div className="flex items-center justify-between">
            <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            {index === 0 && (
              <Badge variant="outline" className="border-primary text-primary">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12%
              </Badge>
            )}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

function SuperAdminProductListingPage() {
  const { products, isLoading, fetchAllProductsForAdmin, deleteProduct } =
    useProductStore();
  const { toast } = useToast();
  const router = useRouter();
  const productFetchRef = useRef(false);
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // ✅ Fix hydration issue
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!productFetchRef.current && isClient) {
      fetchAllProductsForAdmin();
      productFetchRef.current = true;
    }
  }, [fetchAllProductsForAdmin, isClient]);

  async function handleDeleteProduct(getId: string) {
    if (window.confirm("Are you sure you want to delete this product?")) {
      const result = await deleteProduct(getId);
      if (result) {
        toast({
          title: "Product Deleted",
          description: "Product has been deleted successfully",
          className: "bg-success/10 border-success/20 text-success",
        });
        fetchAllProductsForAdmin();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete product",
          variant: "destructive",
        });
      }
    }
  }

  const handleEditProduct = (id: string) => {
    router.push(`/super-admin/products/add?id=${id}`);
  };

  const handleViewProduct = (id: string) => {
    router.push(`/super-admin/products/${id}`);
  };

  // Filter products based on search and category
  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Get unique categories
  const categories = ["all", ...new Set(products?.map(p => p.category).filter(Boolean))];

  if (!isClient || isLoading) {
    return <ProductTableSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="glass-effect rounded-2xl p-6 border border-glass-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Product Inventory
                  </h1>
                  <p className="text-muted-foreground">
                    Manage your futuristic product collection
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Button
                onClick={() => router.push("/super-admin/products/add")}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary-light hover:to-secondary-light text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Product
              </Button>
              
              <Button variant="outline" className="border-border">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </header>

        {/* Stats Overview */}
        <StatsOverview products={products || []} />

        {/* Controls Section */}
        <div className="glass-effect rounded-xl p-4 border border-glass-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input border-border focus:ring-primary/50"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center bg-card rounded-lg p-1">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className={viewMode === "table" ? "bg-primary text-primary-foreground" : ""}
                >
                  Table
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-primary text-primary-foreground" : ""}
                >
                  Grid
                </Button>
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-input border-border rounded-lg px-3 py-2 text-sm focus:ring-primary/50 focus:border-primary"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat.toUpperCase()}
                  </option>
                ))}
              </select>

              <Button variant="outline" size="icon" className="border-border">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {viewMode === "grid" ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onView={handleViewProduct}
              />
            ))}
          </div>
        ) : (
          // Table View
          <div className="glass-effect rounded-xl border border-glass-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[300px]">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Product
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Price
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Stock
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Category
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Status
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Package className="h-8 w-8 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">No products found</p>
                            <p className="text-sm text-muted-foreground">
                              {searchQuery ? "Try a different search term" : "Add your first product to get started"}
                            </p>
                          </div>
                          {!searchQuery && (
                            <Button
                              onClick={() => router.push("/super-admin/products/add")}
                              variant="outline"
                              className="mt-2"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Product
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow 
                        key={product.id} 
                        className="hover:bg-primary/5 group transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                                {product.images?.[0] ? (
                                  <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              {product.stock === 0 && (
                                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                                  <XCircle className="h-4 w-4 text-white" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {product.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ID: {product.id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-bold text-primary">
                              ${product.price?.toFixed(2) || "0.00"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${
                              product.stock > 10 ? 'text-success' : 
                              product.stock > 0 ? 'text-warning' : 
                              'text-destructive'
                            }`}>
                              {product.stock || 0}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              items
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-border">
                            {product.category ? product.category.toUpperCase() : "UNCATEGORIZED"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge stock={product.stock || 0} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              onClick={() => handleViewProduct(product.id)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleEditProduct(product.id)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-secondary"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteProduct(product.id)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Footer Stats */}
        {filteredProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>
                Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> of{" "}
                <span className="font-semibold text-foreground">{products?.length || 0}</span> products
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-success"></div>
                In Stock: {products?.filter(p => p.stock > 10).length || 0}
              </span>
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-warning"></div>
                Low Stock: {products?.filter(p => p.stock > 0 && p.stock <= 10).length || 0}
              </span>
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-destructive"></div>
                Out of Stock: {products?.filter(p => p.stock === 0).length || 0}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SuperAdminProductListingPage;