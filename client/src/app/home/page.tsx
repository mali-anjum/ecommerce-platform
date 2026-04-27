// "use client";

// import { Button } from "@/components/ui/button";
// import { useSettingsStore } from "@/store/useSettingsStore";
// import { useEffect, useState } from "react";

// const gridItems = [
//   {
//     title: "WOMEN",
//     subtitle: "From world's top designer",
//     image:
//       "https://images.unsplash.com/photo-1614251056216-f748f76cd228?q=80&w=1974&auto=format&fit=crop",
//   },
//   {
//     title: "FALL LEGENDS",
//     subtitle: "Timeless cool weather",
//     image:
//       "https://avon-demo.myshopify.com/cdn/shop/files/demo1-winter1_600x.png?v=1733380268",
//   },
//   {
//     title: "ACCESSORIES",
//     subtitle: "Everything you need",
//     image:
//       "https://avon-demo.myshopify.com/cdn/shop/files/demo1-winter4_600x.png?v=1733380275",
//   },
//   {
//     title: "HOLIDAY SPARKLE EDIT",
//     subtitle: "Party season ready",
//     image:
//       "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1974&auto=format&fit=crop",
//   },
// ];

// function HomePage() {
//   const [currentSlide, setCurrentSlide] = useState(0);
//   const { banners, featuredProducts, fetchFeaturedProducts, fetchBanners } =
//     useSettingsStore();

//   useEffect(() => {
//     fetchBanners();
//     fetchFeaturedProducts();
//   }, [fetchBanners, fetchFeaturedProducts]);

//   useEffect(() => {
//     const bannerTimer = setInterval(() => {
//       setCurrentSlide((prev) => (prev + 1) % banners.length);
//     }, 5000);

//     return () => clearInterval(bannerTimer);
//   }, [banners.length]);

//   console.log(banners, featuredProducts);

//   return (
//     <div className="min-h-screen bg-white">
//       <section className="relative h-[600px] overflow-hidden">
//         {banners.map((bannerItem, index) => (
//           <div
//             className={`absolute inset-0 transition-opacity duration-1000 ${
//               currentSlide === index ? "opacity-100" : "opacity-0"
//             }`}
//             key={bannerItem.id}
//           >
//             <div className="absolute inset-0">
//               <img
//                 src={bannerItem.imageUrl}
//                 alt={`Banner ${index + 1}`}
//                 className="w-full h-full object-cover"
//               />
//               <div className="absolute inset-0 bg-black bg-opacity-20" />
//             </div>
//             <div className="relative h-full container mx-auto px-4 flex items-center">
//               <div className="text-white space-y-6">
//                 <span className="text-sm uppercase tracking-wider">
//                   I AM JOHN
//                 </span>
//                 <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
//                   BEST SELLING
//                   <br />
//                   E-COMMERCE WEBSITE
//                 </h1>
//                 <p className="text-lg">
//                   A Creative, Flexible , Clean, Easy to use and
//                   <br />
//                   High Performance E-Commerce Theme
//                 </p>
//                 <Button className="bg-white text-black hover:bg-gray-100 px-8 py-6 text-lg">
//                   SHOP NOW
//                 </Button>
//               </div>
//             </div>
//           </div>
//         ))}
//         <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
//           {banners.map((_, index) => (
//             <button
//               key={index}
//               onClick={() => setCurrentSlide(index)}
//               className={`w-2 h-2 rounded-full transition-all ${
//                 currentSlide === index
//                   ? "bg-white w-6"
//                   : "bg-white/50 hover:bg-white/75"
//               }`}
//             />
//           ))}
//         </div>
//       </section>

//       {/* grid section */}
//       <section className="py-16">
//         <div className="container mx-auto px-4">
//           <h2 className="text-center text-3xl font-semibold mb-2">
//             THE WINTER EDIT
//           </h2>
//           <p className="text-center text-gray-500 mb-8">
//             Designed to keep your satisfaction and warmth
//           </p>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             {gridItems.map((gridItem, index) => (
//               <div key={index} className="relative group overflow-hidden">
//                 <div className="aspect-[3/4]">
//                   <img
//                     src={gridItem.image}
//                     alt={gridItem.title}
//                     className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
//                   />
//                 </div>
//                 <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//                   <div className="text-center text-white p-4">
//                     <h3 className="text-xl font-semibold mb-2">
//                       {gridItem.title}
//                     </h3>
//                     <p className="text-sm">{gridItem.subtitle}</p>
//                     <Button className="mt-4 bg-white text-black hover:bg-gray-100">
//                       SHOP NOW
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Feature products section */}
//       <section className="py-16">
//         <div className="container mx-auto px-4">
//           <h2 className="text-center text-3xl font-semibold mb-2">
//             NEW ARRIVALS
//           </h2>
//           <p className="text-center text-gray-500 mb-8">
//             Shop our new arrivals from established brands
//           </p>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             {featuredProducts.map((productItem, index) => (
//               <div key={index} className="relative group overflow-hidden">
//                 <div className="aspect-[3/4]">
//                   <img
//                     src={productItem.images[0]}
//                     alt={productItem.name}
//                     className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
//                   />
//                 </div>
//                 <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//                   <div className="text-center text-white p-4">
//                     <h3 className="text-xl font-semibold mb-2">
//                       {productItem.name}
//                     </h3>
//                     <p className="text-sm">{productItem.price}</p>
//                     <Button className="mt-4 bg-white text-black hover:bg-gray-100">
//                       QUICK ViEW
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }

// export default HomePage;

"use client";

import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useEffect, useState, useCallback, memo } from "react";
import Link from "next/link";
import axios from "axios";
import { API_ROUTES } from "@/utils/routes/api";
import type { Product } from "@/types/product";

/** Hero slides when DB has no banners yet (matches seeded defaults) */
const FALLBACK_BANNERS = [
  {
    id: "fallback-1",
    imageUrl:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&q=80",
  },
  {
    id: "fallback-2",
    imageUrl:
      "https://images.unsplash.com/photo-1556742049-0cfe3b1a2b88?auto=format&fit=crop&w=1920&q=80",
  },
];

/** Shop-by-pillar tiles (aligned with mega-menu / category catalog) */
const gridItems = [
  {
    title: "Electronics",
    subtitle: "Phones, laptops, wearables & audio",
    image:
      "https://images.unsplash.com/photo-1498049794561-8590a66e234a?auto=format&fit=crop&w=1200&q=80",
    shopHref: "/products?mainCategory=Electronics",
  },
  {
    title: "Fashion",
    subtitle: "Men, women, kids & accessories",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
    shopHref: "/products?mainCategory=Fashion",
  },
  {
    title: "Home & Living",
    subtitle: "Furniture, décor, kitchen & lighting",
    image:
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&q=80",
    shopHref: "/products?mainCategory=Home%20%26%20Living",
  },
  {
    title: "Beauty",
    subtitle: "Skincare, makeup, fragrance & haircare",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
    shopHref: "/products?mainCategory=Beauty",
  },
];

function formatPrice(value: number | string | undefined): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "number") return `$${value.toFixed(2)}`;
  return String(value);
}

// Modular Components
const BannerSlide = memo(({ banner, isActive }: { banner: any; isActive: boolean }) => (
  <div
    className={`absolute inset-0 transition-all duration-1000 theme-transition ${
      isActive ? "opacity-100 z-10" : "opacity-0 z-0"
    }`}
  >
    <div className="absolute inset-0">
      <img
        src={banner.imageUrl}
        alt={`Banner ${banner.id}`}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/50 to-transparent" />
      <div className="absolute inset-0 cosmic-gradient opacity-20" />
    </div>
    <div className="relative h-full container mx-auto px-4 flex items-center">
      <div className="space-y-6 max-w-2xl">
        <span className="text-sm uppercase tracking-wider font-semibold text-primary text-glow">
          I AM JOHN
        </span>
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight text-foreground">
          BEST SELLING
          <br />
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            E-COMMERCE WEBSITE
          </span>
        </h1>
        <p className="text-lg text-muted-foreground">
          A Creative, Flexible, Clean, Easy to use and
          <br />
          High Performance E-Commerce Theme
        </p>
        <Button
          asChild
          className="bg-primary text-primary-foreground hover:bg-primary-light px-8 py-6 text-lg rounded-lg glass-effect border-glass-border neon-border hover:scale-105 transition-transform duration-300"
        >
          <Link href="/products">SHOP NOW</Link>
        </Button>
      </div>
    </div>
  </div>
));

BannerSlide.displayName = "BannerSlide";

const SlideIndicator = memo(({ count, current, onChange }: { 
  count: number; 
  current: number; 
  onChange: (index: number) => void 
}) => (
  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
    {Array.from({ length: count }).map((_, index) => (
      <button
        key={index}
        onClick={() => onChange(index)}
        className={`w-3 h-3 rounded-full transition-all duration-300 theme-transition ${
          current === index
            ? "bg-primary w-8 neon-border"
            : "bg-primary/30 hover:bg-primary/50 backdrop-blur-sm"
        }`}
        aria-label={`Go to slide ${index + 1}`}
      />
    ))}
  </div>
));

SlideIndicator.displayName = "SlideIndicator";

const ProductCard = memo(({ product }: { product: Product }) => (
  <div className="group relative overflow-hidden rounded-xl glass-effect border-glass-border hover:border-primary/50 transition-all duration-500 theme-transition hover:scale-[1.02]">
    <div className="aspect-[3/4] relative overflow-hidden">
      <img
        src={product.images[0]}
        alt={product.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/95 to-transparent transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
      <div className="text-center space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
        <p className="text-primary font-bold text-xl">{formatPrice(product.price)}</p>
        <div className="flex gap-2 justify-center">
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary-light px-6 rounded-lg transition-all duration-300 hover:scale-105"
          >
            <Link href={`/products/${product.id}`}>QUICK VIEW</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10 rounded-lg"
          >
            <Link href={`/products/${product.id}`}>VIEW</Link>
          </Button>
        </div>
      </div>
    </div>
    <div className="absolute top-4 right-4">
      <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold">
        NEW
      </span>
    </div>
  </div>
));

ProductCard.displayName = "ProductCard";

const GridItemCard = memo(({ item }: { item: (typeof gridItems)[0] }) => (
  <div className="group relative overflow-hidden rounded-xl glass-effect border-glass-border hover:neon-border transition-all duration-500 theme-transition">
    <div className="aspect-[3/4] relative overflow-hidden">
      <img
        src={item.image}
        alt={item.title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      <div className="hologram-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 theme-transition">
      <div className="text-center p-8 space-y-4 backdrop-blur-glass bg-glass rounded-xl border-glass-border">
        <h3 className="text-2xl font-bold text-foreground">{item.title}</h3>
        <p className="text-muted-foreground">{item.subtitle}</p>
        <Button
          asChild
          className="bg-primary text-primary-foreground hover:bg-primary-light px-6 rounded-lg neon-border hover:scale-105 transition-transform duration-300"
        >
          <Link href={item.shopHref}>SHOP NOW</Link>
        </Button>
      </div>
    </div>
    <div className="absolute bottom-6 left-6">
      <h3 className="text-2xl font-bold text-foreground">{item.title}</h3>
      <p className="text-muted-foreground text-sm">{item.subtitle}</p>
    </div>
  </div>
));

GridItemCard.displayName = "GridItemCard";

const SectionHeader = memo(({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="text-center space-y-3 mb-12">
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
      {title}
    </h2>
    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
      {subtitle}
    </p>
    <div className="w-24 h-1 bg-gradient-to-r from-primary via-secondary to-accent mx-auto rounded-full" />
  </div>
));

SectionHeader.displayName = "SectionHeader";

// Main HomePage Component
function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [catalogFallback, setCatalogFallback] = useState<Product[]>([]);
  const { banners, featuredProducts, fetchFeaturedProducts, fetchBanners } =
    useSettingsStore();

  const heroSlides =
    banners.length > 0 ? banners : FALLBACK_BANNERS;

  useEffect(() => {
    fetchBanners();
    fetchFeaturedProducts();
  }, [fetchBanners, fetchFeaturedProducts]);

  useEffect(() => {
    if (featuredProducts.length > 0) return;
    let cancelled = false;
    axios
      .get(`${API_ROUTES.PRODUCTS}/fetch-client-products`, {
        params: { limit: 8, page: 1, sortBy: "createdAt", sortOrder: "desc" },
        withCredentials: true,
      })
      .then((res) => {
        const d = res.data?.data ?? res.data;
        const list = d?.products ?? [];
        if (!cancelled && Array.isArray(list)) {
          setCatalogFallback(list as Product[]);
        }
      })
      .catch(() => {
        /* empty DB or network */
      });
    return () => {
      cancelled = true;
    };
  }, [featuredProducts.length]);

  useEffect(() => {
    if (heroSlides.length === 0) return;
    const bannerTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(bannerTimer);
  }, [heroSlides.length]);

  const showcaseProducts: Product[] =
    featuredProducts.length > 0
      ? (featuredProducts as unknown as Product[])
      : catalogFallback;

  const handleSlideChange = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground theme-transition">
      {/* Hero Banner Section */}
      <section className="relative h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden">
        {heroSlides.map((banner, index) => (
          <BannerSlide
            key={banner.id}
            banner={banner}
            isActive={currentSlide === index}
          />
        ))}
        
        <SlideIndicator
          count={heroSlides.length}
          current={currentSlide}
          onChange={handleSlideChange}
        />

        {/* Floating elements for futuristic effect */}
        <div className="absolute top-1/4 left-10 w-4 h-4 rounded-full bg-primary/20 animate-pulse" />
        <div className="absolute top-1/3 right-20 w-6 h-6 rounded-full bg-secondary/20 animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-3 h-3 rounded-full bg-accent/20 animate-pulse animation-delay-1000" />
      </section>

      {/* Grid Section */}
      <section className="py-16 md:py-20 lg:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            title="Shop by category"
            subtitle="Browse our Electronics, Fashion, Home & Living, and Beauty departments—like leading storefronts."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {gridItems.map((item, index) => (
              <GridItemCard key={index} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-b from-background to-card/30">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            title="Featured picks"
            subtitle="Staff picks and bestsellers—mirroring “featured collection” strips on Amazon and Shopify storefronts."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {showcaseProducts.map((product, index) => (
              <ProductCard key={product.id || index} product={product} />
            ))}
          </div>
          {showcaseProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-block p-8 rounded-xl glass-effect border-glass-border">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
                <p className="text-muted-foreground">Loading featured products...</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto rounded-2xl p-8 md:p-12 futuristic-gradient relative overflow-hidden">
            <div className="hologram-effect absolute inset-0" />
            <div className="relative z-10 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground">
                JOIN OUR COMMUNITY
              </h2>
              <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
                Get exclusive access to new collections, special offers, and fashion insights
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
                />
                <Button className="bg-white text-background hover:bg-white/90 px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105">
                  SUBSCRIBE
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="error-grid absolute inset-0" />
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="error-particle absolute"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default HomePage;