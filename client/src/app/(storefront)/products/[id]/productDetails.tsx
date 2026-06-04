// "use client";

// import { Button } from "@/components/ui/button";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { useProductStore } from "@/components/products/state/useProductStore";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import ProductDetailsSkeleton from "./productSkeleton";
// import { useCartStore } from "@/components/storefront/cart/state/useCartStore";
// import { useToast } from "@/components/ui/hooks/use-toast";

// function ProductDetailsContent({ id }: { id: string }) {
//   const [product, setProduct] = useState<any>(null);
//   const { getProductById, isLoading } = useProductStore();
//   const { addToCart } = useCartStore();
//   const { toast } = useToast();
//   const router = useRouter();
//   const [selectedImage, setSelectedImage] = useState(0);
//   const [selectedColor, setSelectedColor] = useState(0);
//   const [selectedSize, setSelectedSize] = useState("");
//   const [quantity, setQuantity] = useState(1);

//   useEffect(() => {
//     const fetchProduct = async () => {
//       const productDetails = await getProductById(id);

//       const productData = productDetails;

//       if (productData) {
//         setProduct(productData);
//       } else {
//         router.push("/404");
//       }
//     };

//     fetchProduct();
//   }, [id, getProductById, router]);

//   const handleAddToCart = () => {
//     if (product) {
//       addToCart({
//         productId: product.id,
//         name: product.name,
//         price: product.price,
//         image: product.images[0],
//         color: product.colors[selectedColor],
//         size: selectedSize,
//         quantity: quantity,
//       });

//       setSelectedSize("");
//       setSelectedColor(0);
//       setQuantity(1);

//       toast({
//         title: "Product is added to cart",
//       });
//     }
//   };

//   console.log(id, product);

//   if (!product || isLoading) return <ProductDetailsSkeleton />;

//   return (
//     <div className="min-h-screen bg-white">
//       <div className="container mx-auto px-4 py-8">
//         <div className="flex flex-col lg:flex-row gap-8">
//           <div className="lg:w-2/3 flex gap-4">
//             <div className="hidden lg:flex flex-col gap-2 w-24">
//               {product?.images.map((image: string, index: number) => (
//                 <button
//                   onClick={() => setSelectedImage(index)}
//                   key={index}
//                   className={`${
//                     selectedImage === index
//                       ? "border-black"
//                       : "border-transparent"
//                   } border-2`}
//                 >
//                   <img
//                     src={image}
//                     alt={`Product-${index + 1}`}
//                     className="w-full aspect-square object-cover"
//                   />
//                 </button>
//               ))}
//             </div>
//             <div className="flex-1 relative w-[300px]">
//               <img
//                 src={product.images[selectedImage]}
//                 alt={product.name}
//                 className="w-full h-full object-cover"
//               />
//             </div>
//           </div>
//           <div className="lg:w-1/3 space-y-6">
//             <div>
//               <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
//               <div>
//                 <span className="text-2xl font-semibold">
//                   ${product.price.toFixed(2)}
//                 </span>
//               </div>
//             </div>
//             <div>
//               <h3 className="font-medium mb-2">Color</h3>
//               <div className="flex gap-2">
//                 {product.colors.map((color: string, index: number) => (
//                   <button
//                     key={index}
//                     className={`w-12 h-12 rounded-full border-2 ${
//                       selectedColor === index
//                         ? "border-black"
//                         : "border-gray-300"
//                     }`}
//                     style={{ backgroundColor: color }}
//                     onClick={() => setSelectedColor(index)}
//                   />
//                 ))}
//               </div>
//             </div>
//             <div>
//               <h3 className="font-medium mb-2">Size</h3>
//               <div className="flex gap-2">
//                 {product.sizes.map((size: string, index: string) => (
//                   <Button
//                     key={index}
//                     className={`w-12 h-12`}
//                     variant={selectedSize === size ? "default" : "outline-solid"}
//                     onClick={() => setSelectedSize(size)}
//                   >
//                     {size}
//                   </Button>
//                 ))}
//               </div>
//             </div>
//             <div>
//               <h3 className="font-medium mb-2">Quantity</h3>
//               <div className="flex items-center gap-2">
//                 <Button
//                   onClick={() => setQuantity(Math.max(1, quantity - 1))}
//                   variant="outline"
//                 >
//                   -
//                 </Button>
//                 <span className="w-12 text-center">{quantity}</span>
//                 <Button
//                   onClick={() => setQuantity(quantity + 1)}
//                   variant="outline"
//                 >
//                   +
//                 </Button>
//               </div>
//             </div>
//             <div>
//               <Button
//                 className={"w-full bg-black text-white hover:bg-gray-800"}
//                 onClick={handleAddToCart}
//               >
//                 ADD TO CART
//               </Button>
//             </div>
//           </div>
//         </div>
//         <div className="mt-16">
//           <Tabs defaultValue="details">
//             <TabsList className="w-full justify-start border-b">
//               <TabsTrigger value="details">PRODUCT DESCRIPTION</TabsTrigger>
//               <TabsTrigger value="reviews">REVIEWS</TabsTrigger>
//               <TabsTrigger value="shipping">
//                 SHIPPING & RETURNS INFO
//               </TabsTrigger>
//             </TabsList>
//             <TabsContent value="details" className="mt-5">
//               <p className="text-gray-700 mb-4">{product.description}</p>
//             </TabsContent>
//             <TabsContent value="reviews" className="mt-5">
//               Reviews
//             </TabsContent>
//             <TabsContent value="shipping">
//               <p className="text-gray-700 mb-4">
//                 Shipping and return information goes here.Please read the info
//                 before proceeding.
//               </p>
//             </TabsContent>
//           </Tabs>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default ProductDetailsContent;

"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProductStore } from "@/components/products/state/useProductStore";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, memo } from "react";
import ProductDetailsSkeleton from "./productSkeleton";
import { useCartStore } from "@/components/storefront/cart/state/useCartStore";
import { useAuthStore } from "@/components/auth/state/useAuthStore";
import { useToast } from "@/components/ui/hooks/use-toast";
import { Star, Truck, Shield, RefreshCw } from "lucide-react";
import { WishlistHeartButton } from "@/components/storefront/wishlist/atoms/WishlistHeartButton";
import { WishlistCtaButton } from "@/components/storefront/wishlist/atoms/WishlistCtaButton";
import { buildWishlistSnapshot } from "@/components/storefront/wishlist/utils/wishlistSnapshot";
import { trackProductView } from "@/lib/analytics/trackEvent";

// Modular Components
const ProductImageGallery = memo(({ 
  images, 
  selectedImage, 
  onSelect 
}: { 
  images: string[]; 
  selectedImage: number; 
  onSelect: (index: number) => void 
}) => (
  <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
    {/* Thumbnail strip */}
    <div className="hidden lg:flex flex-col gap-3 w-20">
      {images.map((image: string, index: number) => (
        <button
          onClick={() => onSelect(index)}
          key={index}
          className={`relative overflow-hidden rounded-lg border-2 transition-all duration-300 theme-transition hover:scale-105 ${
            selectedImage === index
              ? "border-primary neon-border"
              : "border-glass-border hover:border-primary/50"
          }`}
          aria-label={`View image ${index + 1}`}
        >
          <img
            src={image}
            alt={`Thumbnail ${index + 1}`}
            className="w-full aspect-square object-cover"
            loading="lazy"
          />
          {selectedImage === index && (
            <div className="absolute inset-0 bg-primary/10" />
          )}
        </button>
      ))}
    </div>

    {/* Main image */}
    <div className="flex-1 relative">
      <div className="rounded-2xl overflow-hidden glass-effect border-glass-border neon-border">
        <img
          src={images[selectedImage]}
          alt="Main product image"
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="eager"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xs">
            FEATURED
          </span>
        </div>
      </div>

      {/* Mobile thumbnails */}
      <div className="flex lg:hidden gap-3 mt-4 overflow-x-auto pb-2">
        {images.map((image: string, index: number) => (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={`shrink-0 w-16 h-16 rounded-lg border-2 transition-all duration-300 ${
              selectedImage === index
                ? "border-primary"
                : "border-glass-border"
            }`}
          >
            <img
              src={image}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover rounded"
            />
          </button>
        ))}
      </div>
    </div>
  </div>
));

ProductImageGallery.displayName = "ProductImageGallery";

const ColorSelector = memo(({ 
  colors, 
  selectedColor, 
  onSelect 
}: { 
  colors: string[]; 
  selectedColor: number; 
  onSelect: (index: number) => void 
}) => (
  <div>
    <h3 className="font-semibold mb-3 text-lg text-foreground flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-primary" />
      Color
    </h3>
    <div className="flex flex-wrap gap-3">
      {colors.map((color: string, index: number) => (
        <button
          key={index}
          className={`relative w-14 h-14 rounded-full border-4 transition-all duration-300 theme-transition hover:scale-110 ${
            selectedColor === index
              ? "border-primary-light shadow-lg shadow-primary/30"
              : "border-card hover:border-primary/50"
          }`}
          style={{ backgroundColor: color }}
          onClick={() => onSelect(index)}
          aria-label={`Select color ${index + 1}`}
        >
          {selectedColor === index && (
            <div className="absolute -inset-1 rounded-full border-2 border-primary-light animate-ping" />
          )}
          <div className="absolute inset-0 rounded-full border-2 border-background/20" />
        </button>
      ))}
    </div>
  </div>
));

ColorSelector.displayName = "ColorSelector";

const SizeSelector = memo(({ 
  sizes, 
  selectedSize, 
  onSelect 
}: { 
  sizes: string[]; 
  selectedSize: string; 
  onSelect: (size: string) => void 
}) => (
  <div>
    <h3 className="font-semibold mb-3 text-lg text-foreground flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-secondary" />
      Size
    </h3>
    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
      {sizes.map((size: string, index: number) => (
        <Button
          key={index}
          className={`h-12 rounded-lg transition-all duration-300 theme-transition font-medium ${
            selectedSize === size
              ? "bg-primary text-primary-foreground neon-border"
              : "bg-card hover:bg-card/80 border-glass-border hover:border-primary/30"
          } hover:scale-105`}
          onClick={() => onSelect(size)}
        >
          {size}
        </Button>
      ))}
    </div>
  </div>
));

SizeSelector.displayName = "SizeSelector";

const QuantitySelector = memo(({ 
  quantity, 
  onIncrement, 
  onDecrement 
}: { 
  quantity: number; 
  onIncrement: () => void; 
  onDecrement: () => void 
}) => (
  <div>
    <h3 className="font-semibold mb-3 text-lg text-foreground flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-accent" />
      Quantity
    </h3>
    <div className="flex items-center gap-3">
      <Button
        onClick={onDecrement}
        variant="outline"
        className="w-12 h-12 rounded-lg border-glass-border hover:border-destructive hover:text-destructive hover:scale-105 transition-all duration-300"
        disabled={quantity <= 1}
      >
        <span className="text-xl">−</span>
      </Button>
      <div className="w-16 h-12 flex items-center justify-center rounded-lg glass-effect border-glass-border">
        <span className="text-xl font-bold text-foreground">{quantity}</span>
      </div>
      <Button
        onClick={onIncrement}
        variant="outline"
        className="w-12 h-12 rounded-lg border-glass-border hover:border-primary hover:text-primary hover:scale-105 transition-all duration-300"
      >
        <span className="text-xl">+</span>
      </Button>
    </div>
  </div>
));

QuantitySelector.displayName = "QuantitySelector";

const ProductInfo = memo(({ product }: { product: any }) => (
  <div className="space-y-4">
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < 4
                  ? "fill-primary stroke-primary"
                  : "fill-muted stroke-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">(128 reviews)</span>
      </div>
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
        {product.name}
      </h1>
      <div className="flex items-center gap-4">
        <span className="text-3xl font-bold bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
          ${product.price.toFixed(2)}
        </span>
        {product.originalPrice && (
          <span className="text-xl text-muted-foreground line-through">
            ${product.originalPrice.toFixed(2)}
          </span>
        )}
        {product.discount && (
          <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-semibold">
            -{product.discount}%
          </span>
        )}
      </div>
    </div>

    <p className="text-lg text-muted-foreground leading-relaxed">
      {product.shortDescription || product.description.substring(0, 150)}...
    </p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
      <div className="flex items-center gap-3 p-3 rounded-lg glass-effect">
        <Truck className="w-5 h-5 text-primary" />
        <div>
          <p className="font-semibold text-foreground">Free Shipping</p>
          <p className="text-sm text-muted-foreground">Over $50</p>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg glass-effect">
        <Shield className="w-5 h-5 text-secondary" />
        <div>
          <p className="font-semibold text-foreground">2 Year Warranty</p>
          <p className="text-sm text-muted-foreground">Guaranteed</p>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg glass-effect">
        <RefreshCw className="w-5 h-5 text-accent" />
        <div>
          <p className="font-semibold text-foreground">30-Day Returns</p>
          <p className="text-sm text-muted-foreground">Easy exchange</p>
        </div>
      </div>
    </div>
  </div>
));

ProductInfo.displayName = "ProductInfo";

const ProductTabs = memo(({ product }: { product: any }) => (
  <div className="mt-12 md:mt-16">
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 gap-2">
        {[
          { value: "details", label: "DESCRIPTION" },
          { value: "specs", label: "SPECIFICATIONS" },
          { value: "reviews", label: "REVIEWS" },
          { value: "shipping", label: "SHIPPING" },
        ].map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="relative px-6 py-3 rounded-t-lg data-[state=active]:bg-card data-[state=active]:border data-[state=active]:border-b-0 data-[state=active]:border-border data-[state=active]:text-foreground border-transparent border-b-2 hover:bg-card/50 transition-all duration-300 theme-transition"
          >
            {tab.label}
            {tab.value === "details" && (
              <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-linear-to-r from-primary via-secondary to-accent rounded-full" />
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="details" className="mt-8">
        <div className="rounded-xl p-6 md:p-8 glass-effect border-glass-border">
          <h3 className="text-2xl font-bold mb-6 text-foreground">Product Details</h3>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {product.description}
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.features?.map((feature: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="specs" className="mt-8">
        <div className="rounded-xl p-6 md:p-8 glass-effect border-glass-border">
          <h3 className="text-2xl font-bold mb-6 text-foreground">Specifications</h3>
          <div className="space-y-4">
            {product.specifications?.map((spec: any, index: number) => (
              <div key={index} className="flex justify-between py-3 border-b border-border/50">
                <span className="font-medium text-foreground">{spec.label}</span>
                <span className="text-muted-foreground">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="reviews" className="mt-8">
        <div className="rounded-xl p-6 md:p-8 glass-effect border-glass-border">
          <h3 className="text-2xl font-bold mb-6 text-foreground">Customer Reviews</h3>
          <div className="hologram-effect rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="shipping" className="mt-8">
        <div className="rounded-xl p-6 md:p-8 glass-effect border-glass-border">
          <h3 className="text-2xl font-bold mb-6 text-foreground">Shipping & Returns</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <h4 className="font-semibold text-foreground mb-2">Free Shipping</h4>
              <p className="text-muted-foreground">
                Enjoy free standard shipping on all orders over $50. Express shipping available at checkout.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/10">
              <h4 className="font-semibold text-foreground mb-2">Easy Returns</h4>
              <p className="text-muted-foreground">
                Return any item within 30 days of delivery for a full refund. Items must be in original condition.
              </p>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
));

ProductTabs.displayName = "ProductTabs";

// Main Component
function ProductDetailsContent({ id }: { id: string }) {
  const [product, setProduct] = useState<any>(null);
  const { getProductById, isLoading } = useProductStore();
  const { addToCart } = useCartStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const productDetails = await getProductById(id);
      const productData = productDetails;

      if (productData) {
        setProduct(productData);
        // Set default variant selections only when options exist.
        if (productData.sizes?.length > 0) {
          setSelectedSize(productData.sizes[0]);
        } else {
          setSelectedSize("");
        }
        if (productData.colors?.length > 0) {
          setSelectedColor(0);
        } else {
          setSelectedColor(null);
        }
      } else {
        router.push("/404");
      }
    };

    fetchProduct();
  }, [id, getProductById, router]);

  useEffect(() => {
    trackProductView(id);
  }, [id]);

  const hasSizeOptions = Array.isArray(product?.sizes) && product.sizes.length > 0;
  const hasColorOptions = Array.isArray(product?.colors) && product.colors.length > 0;
  const selectedColorValue =
    selectedColor !== null && hasColorOptions ? product?.colors?.[selectedColor] : undefined;
  const isInStock = !!product && typeof product.stock === "number" && product.stock > 0;
  const wishlistSnapshot = product ? buildWishlistSnapshot(product) : null;

  const canAddToCart =
    isInStock &&
    !!product &&
    (!hasSizeOptions || !!selectedSize) &&
    (!hasColorOptions || selectedColorValue !== undefined);

  const handleAddToCart = useCallback(() => {
    if (product && canAddToCart) {
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        color: selectedColorValue ?? "Default",
        size: hasSizeOptions ? selectedSize : "",
        quantity: quantity,
      });

      toast({
        title: "🎉 Added to Cart",
        description: `${product.name} has been added to your cart`,
        className: "bg-primary/10 border-primary/20",
      });
    } else {
      toast({
        title: "⚠️ Select Options",
        description: "Please select required options before adding to cart",
        variant: "destructive",
      });
    }
  }, [
    product,
    canAddToCart,
    selectedColorValue,
    hasSizeOptions,
    selectedSize,
    quantity,
    addToCart,
    toast,
  ]);

  const handleIncrement = useCallback(() => {
    setQuantity(prev => prev + 1);
  }, []);

  const handleDecrement = useCallback(() => {
    setQuantity(prev => Math.max(1, prev - 1));
  }, []);

  const handleBuyNow = useCallback(async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (!product || !canAddToCart) {
      toast({
        title: "⚠️ Select Options",
        description: "Please select required options before continuing",
        variant: "destructive",
      });
      return;
    }

    setIsBuyingNow(true);
    try {
      await addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        color: selectedColorValue ?? "Default",
        size: hasSizeOptions ? selectedSize : "",
        quantity: quantity,
      });
      router.push("/checkout");
    } finally {
      setIsBuyingNow(false);
    }
  }, [
    user,
    router,
    product,
    canAddToCart,
    toast,
    addToCart,
    selectedColorValue,
    hasSizeOptions,
    selectedSize,
    quantity,
  ]);

  if (!product || isLoading) return <ProductDetailsSkeleton />;

  return (
    <div className="min-h-screen bg-background text-foreground theme-transition">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="error-grid absolute inset-0 opacity-10" />
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="error-particle absolute animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              animationDelay: `${Math.random() * 3}s`,
              '--particle-opacity': `${Math.random() * 0.3 + 0.1}`,
            } as any}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <button onClick={() => router.push("/")} className="hover:text-foreground transition-colors">
            Home
          </button>
          <span>/</span>
          <button onClick={() => router.push("/products")} className="hover:text-foreground transition-colors">
            Products
          </button>
          <span>/</span>
          <span className="text-foreground font-medium">{product.name}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Column - Images */}
          <div className="lg:w-1/2 relative">
            <ProductImageGallery
              images={product.images}
              selectedImage={selectedImage}
              onSelect={setSelectedImage}
            />
            {isInStock && wishlistSnapshot && (
              <div className="absolute top-4 right-4 z-20">
                <WishlistHeartButton
                  productId={product.id}
                  snapshot={wishlistSnapshot}
                  size="lg"
                />
              </div>
            )}
          </div>

          {/* Right Column - Product Info */}
          <div className="lg:w-1/2">
            <ProductInfo product={product} />

            <div className="space-y-8 mt-8">
              {hasColorOptions ? (
                <ColorSelector
                  colors={product.colors}
                  selectedColor={selectedColor ?? 0}
                  onSelect={setSelectedColor}
                />
              ) : (
                <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                  This product has no color variants.
                </div>
              )}

              {hasSizeOptions ? (
                <SizeSelector
                  sizes={product.sizes}
                  selectedSize={selectedSize}
                  onSelect={setSelectedSize}
                />
              ) : (
                <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                  No size selection is required for this product.
                </div>
              )}

              {!isInStock && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <span className="font-semibold">Out of stock</span>
                  <span className="text-amber-800">
                    {" "}
                    — Save this item to your wishlist and buy when it&apos;s back.
                  </span>
                </div>
              )}

              {isInStock && (
                <QuantitySelector
                  quantity={quantity}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                />
              )}

              <div className="space-y-4 pt-6 border-t border-border">
                {isInStock ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button
                      className="w-full py-6 text-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary-light neon-border hover:scale-[1.02] transition-all duration-300"
                      onClick={handleAddToCart}
                      disabled={!canAddToCart}
                    >
                      {!canAddToCart
                        ? "SELECT REQUIRED OPTIONS"
                        : "ADD TO CART"}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full py-6 text-lg rounded-xl border-glass-border hover:border-primary hover:text-primary hover:scale-[1.02] transition-all duration-300"
                      onClick={handleBuyNow}
                      disabled={isBuyingNow || !canAddToCart}
                    >
                      {isBuyingNow ? "PROCESSING..." : "BUY NOW"}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {wishlistSnapshot ? (
                      <WishlistCtaButton
                        productId={product.id}
                        snapshot={wishlistSnapshot}
                        className="sm:col-span-1"
                      />
                    ) : null}
                    <Button
                      asChild
                      variant="outline"
                      className="w-full py-6 rounded-xl border-glass-border"
                    >
                      <a href={`tel:${product.contactNumber || "1-800-123-4567"}`}>
                        CALL US
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs */}
        <ProductTabs product={product} />

        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-20">
          <Button
            size="icon"
            className="w-12 h-12 rounded-full glass-effect border-glass-border hover:border-primary hover:scale-110 transition-all duration-300"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            ↑
          </Button>
          <Button
            size="icon"
            className="w-12 h-12 rounded-full glass-effect border-glass-border hover:border-secondary hover:scale-110 transition-all duration-300"
            onClick={() => router.push('/cart')}
          >
            🛒
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailsContent;