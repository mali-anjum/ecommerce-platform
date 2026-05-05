"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useProductStore } from "@/store/useProductStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { 
  ImageIcon, 
  Upload, 
  X, 
  Zap, 
  Sparkles, 
  Settings, 
  Package,
  Star,
  Image as ImageLucide,
  LayoutGrid,
  Shield,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  Grid3x3,
  Award,
  TrendingUp
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// ==================== MODULAR COMPONENTS ====================

// 1. File Upload Component
function FileUploadSection({ 
  uploadedFiles, 
  onFileUpload, 
  onRemoveFile 
}: { 
  uploadedFiles: File[]; 
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  onRemoveFile: (index: number) => void;
}) {
  return (
    <div className="glass-effect rounded-2xl p-5 md:p-6 border border-glass-border">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <ImageLucide className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-foreground">Upload Banner Images</h3>
            <p className="text-sm text-muted-foreground">
              Upload images for hero banners (Recommended: 1920x600px)
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-primary/60 text-primary shrink-0 self-start sm:self-center">
          <TrendingUp className="h-3 w-3 mr-1" />
          High Impact
        </Badge>
      </div>

      {/* Upload Area */}
      <Label
        htmlFor="banner-upload"
        className="group relative flex flex-col items-center justify-center w-full min-h-[200px] rounded-2xl cursor-pointer transition-all duration-300 border-2 border-dashed border-primary/45 bg-muted/25 hover:border-primary/90 hover:bg-primary/[0.06] dark:border-primary/50 dark:bg-muted/15"
      >
        <div className="flex flex-col items-center space-y-4 p-8">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
              <Upload className="h-7 w-7 text-primary group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="absolute -inset-2 rounded-full bg-primary/10 animate-pulse"></div>
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">
              Drag & drop or click to upload
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Supports JPG, PNG, WEBP • Max 5MB per image
            </p>
          </div>
          <Button variant="outline" className="border-primary/40 bg-background/50 hover:border-primary hover:bg-primary/5">
            <Plus className="h-4 w-4 mr-2" />
            Browse Files
          </Button>
        </div>
        <Input
          id="banner-upload"
          type="file"
          className="hidden"
          accept="image/*"
          multiple
          onChange={onFileUpload}
        />
      </Label>

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Selected Files ({uploadedFiles.length})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveFile(-1)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedFiles.map((file, index) => (
              <div 
                key={index} 
                className="group relative overflow-hidden rounded-xl border border-border"
              >
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(index);
                    }}
                    className="absolute top-2 right-2 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs text-white truncate">
                      {file.name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 2. Banner Gallery Component
function BannerGallery({ banners }: { banners: any[] }) {
  if (banners.length === 0) return null;

  return (
    <div className="glass-effect rounded-2xl p-6 border border-glass-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
            <LayoutGrid className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Active Banners</h3>
            <p className="text-sm text-muted-foreground">
              Currently displaying on homepage
            </p>
          </div>
        </div>
        <Badge className="bg-success/20 text-success border-success/20">
          <Eye className="h-3 w-3 mr-1" />
          Live
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {banners.map((banner, index) => (
          <div 
            key={banner.id} 
            className="group relative overflow-hidden rounded-xl border border-border hover:border-primary/30 transition-all duration-300"
          >
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10">
              <img
                src={banner.imageUrl}
                alt={`Banner ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
              <div className="text-white text-xs">
                <p>Banner #{index + 1}</p>
                <p className="text-white/70">Click to view details</p>
              </div>
            </div>
            <div className="absolute top-2 right-2">
              <Badge className="bg-primary/90 text-primary-foreground text-xs">
                {index === 0 ? "Active" : "Queue"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. Product Selection Card
interface ProductSelectionCardProps {
  product: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
  selectionCount: number;
  maxSelection: number;
}

function ProductSelectionCard({ 
  product, 
  isSelected, 
  onSelect, 
  selectionCount,
  maxSelection 
}: ProductSelectionCardProps) {
  const isDisabled = !isSelected && selectionCount >= maxSelection;

  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 ${
      isSelected 
        ? "border-primary ring-2 ring-primary/20" 
        : isDisabled 
        ? "opacity-50 cursor-not-allowed" 
        : "border-border hover:border-primary/30"
    }`}>
      <CardContent className="p-4">
        {/* Selection Checkbox */}
        <div className="absolute top-3 right-3 z-10">
          <div className={`h-6 w-6 rounded-full flex items-center justify-center transition-all duration-300 ${
            isSelected 
              ? "bg-primary" 
              : "bg-card border border-border"
          }`}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(product.id)}
              disabled={isDisabled}
              className={`h-4 w-4 ${
                isSelected ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            />
          </div>
        </div>

        {/* Product Image */}
        <div className="relative mb-4">
          <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>
          
          {/* Selection Badge */}
          {isSelected && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-primary text-primary-foreground border-primary">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground line-clamp-1">
            {product.name}
          </h3>
          
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {product.category || 'Uncategorized'}
            </Badge>
            <span className="font-bold text-primary">
              ${product.price?.toFixed(2) || '0.00'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Stock: {product.stock || 0}</span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {product.sales || 0} sold
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 4. Selection Counter Component
function SelectionCounter({ 
  current, 
  max, 
  isAtLimit 
}: { 
  current: number; 
  max: number; 
  isAtLimit: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
          <Award className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Featured Products Selection
          </p>
          <p className={`text-sm ${isAtLimit ? 'text-success' : 'text-muted-foreground'}`}>
            {current} of {max} selected {isAtLimit && '• Limit reached'}
          </p>
        </div>
      </div>
      <div className="ml-auto">
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 bg-card rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                isAtLimit ? 'bg-success' : 'bg-gradient-to-r from-primary to-secondary'
              }`}
              style={{ width: `${(current / max) * 100}%` }}
            />
          </div>
          <span className="font-bold text-foreground">
            {current}/{max}
          </span>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

function SuperAdminSettingsPage() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const { products, fetchAllProductsForAdmin } = useProductStore();
  const {
    featuredProducts,
    banners,
    isLoading,
    error,
    fetchBanners,
    fetchFeaturedProducts,
    addBanners,
    updateFeaturedProducts,
  } = useSettingsStore();
  const pageLoadRef = useRef(false);
  const { toast } = useToast();

  const MAX_FEATURED_PRODUCTS = 8;

  useEffect(() => {
    if (!pageLoadRef.current) {
      fetchBanners();
      fetchAllProductsForAdmin();
      fetchFeaturedProducts();
      pageLoadRef.current = true;
    }
  }, [fetchAllProductsForAdmin, fetchFeaturedProducts, fetchBanners]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles].slice(0, 10)); // Limit to 10 files
    }
  };

  const removeImage = (getCurrentIndex: number) => {
    if (getCurrentIndex === -1) {
      setUploadedFiles([]);
    } else {
      setUploadedFiles(prev => prev.filter((_, i) => i !== getCurrentIndex));
    }
  };

  const handleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }

      if (prev.length >= MAX_FEATURED_PRODUCTS) {
        toast({
          title: "Selection Limit Reached",
          description: `You can only select up to ${MAX_FEATURED_PRODUCTS} featured products`,
          variant: "destructive",
        });
        return prev;
      }

      return [...prev, productId];
    });
  };

  const handleSaveChanges = async () => {
    let successCount = 0;

    // Upload banners if any
    if (uploadedFiles.length > 0) {
      const result = await addBanners(uploadedFiles);
      if (result) {
        successCount++;
        setUploadedFiles([]);
        fetchBanners();
      }
    }

    // Update featured products
    const result = await updateFeaturedProducts(selectedProducts);
    if (result) {
      successCount++;
      toast({
        title: "Success!",
        description: "Settings updated successfully",
        className: "bg-success/10 border-success/20 text-success",
      });
      fetchFeaturedProducts();
    }

    if (successCount > 0) {
      toast({
        title: "Changes Saved",
        description: "All settings have been updated successfully",
      });
    }
  };

  useEffect(() => {
    if (featuredProducts.length > 0) {
      setSelectedProducts(featuredProducts.map(pro => pro.id));
    }
  }, [featuredProducts]);

  const isAtLimit = selectedProducts.length >= MAX_FEATURED_PRODUCTS;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card/20 p-4 md:p-6 pb-10">
      <div className="max-w-7xl mx-auto space-y-5 md:space-y-6">
        {/* Header */}
        <header className="glass-effect rounded-2xl p-5 md:p-6 border border-glass-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -inset-2 rounded-xl bg-primary/20 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Settings Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Manage banners and featured products for your futuristic store
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSaveChanges}
                disabled={isLoading}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary-light hover:to-secondary-light text-primary-foreground"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Save All Changes
                  </div>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Stats Bar — equal-width columns on sm+ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-4 lg:gap-5 items-stretch">
          <div className="glass-effect rounded-xl p-4 md:p-5 border border-glass-border min-h-[92px] min-w-0 flex">
            <div className="flex w-full items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Active Banners</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">{banners.length}</p>
              </div>
              <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                <ImageLucide className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-xl p-4 md:p-5 border border-glass-border min-h-[92px] min-w-0 flex">
            <div className="flex w-full items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Featured Products</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">{selectedProducts.length}</p>
              </div>
              <div className="h-10 w-10 shrink-0 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-secondary" />
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-xl p-4 md:p-5 border border-glass-border min-h-[92px] min-w-0 flex">
            <div className="flex w-full items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">{products.length}</p>
              </div>
              <div className="h-10 w-10 shrink-0 rounded-lg bg-accent/10 flex items-center justify-center">
                <Grid3x3 className="h-5 w-5 text-accent" />
              </div>
            </div>
          </div>
        </div>

        {/* Banner Management */}
        <div className="space-y-6">
          {/* Upload Section */}
          <FileUploadSection 
            uploadedFiles={uploadedFiles} 
            onFileUpload={handleImageUpload} 
            onRemoveFile={removeImage} 
          />

          {/* Active Banners */}
          <BannerGallery banners={banners} />
        </div>

        {/* Featured Products Selection */}
        <div className="glass-effect rounded-2xl p-6 border border-glass-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
                <Star className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Featured Products</h2>
                <p className="text-sm text-muted-foreground">
                  Select up to {MAX_FEATURED_PRODUCTS} products to showcase on homepage
                </p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <Shield className="h-4 w-4 text-success" />
              <span className="text-sm text-success">Real-time updates</span>
            </div>
          </div>

          {/* Selection Counter */}
          <SelectionCounter 
            current={selectedProducts.length} 
            max={MAX_FEATURED_PRODUCTS} 
            isAtLimit={isAtLimit} 
          />

          {/* Products Grid */}
          {isAtLimit && (
            <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <p className="text-sm text-success">
                Maximum selection reached ({MAX_FEATURED_PRODUCTS} products)
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="mt-6">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <p className="text-foreground font-medium">No products available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add products to select them as featured
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductSelectionCard
                    key={product.id}
                    product={product}
                    isSelected={selectedProducts.includes(product.id)}
                    onSelect={handleProductSelection}
                    selectionCount={selectedProducts.length}
                    maxSelection={MAX_FEATURED_PRODUCTS}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="glass-effect rounded-2xl p-6 border border-glass-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">Ready to update?</h3>
              <p className="text-sm text-muted-foreground">
                Your changes will be reflected immediately on the live website
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setUploadedFiles([]);
                  setSelectedProducts(featuredProducts.map(pro => pro.id));
                }}
                className="border-border"
              >
                Reset Changes
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={isLoading}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary-light hover:to-secondary-light text-primary-foreground"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Apply All Settings
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminSettingsPage;