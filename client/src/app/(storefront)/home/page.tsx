
"use client";

import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/components/super-admin/state/useSettingsStore";
import { useEffect, useState, useCallback, memo } from "react";
import Link from "next/link";
import axios from "axios";
import { API_ROUTES } from "@/lib/routes/api";
import type { Product } from "@/components/products/types/product";
import { WishlistHeartButton } from "@/components/storefront/wishlist/atoms/WishlistHeartButton";
import { buildWishlistSnapshot } from "@/components/storefront/wishlist/utils/wishlistSnapshot";
import { sentryTracker } from "@/lib/monitoring";

const TILE_IMAGE_FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='1600' viewBox='0 0 1200 1600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%230f172a'/><stop offset='100%' stop-color='%23334155'/></linearGradient></defs><rect width='1200' height='1600' fill='url(%23g)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23e2e8f0' font-size='62' font-family='Arial, sans-serif'>Category Image</text></svg>";

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
        onError={(event) => {
          const element = event.currentTarget;
          if (element.src !== FALLBACK_BANNERS[0].imageUrl) {
            element.src = FALLBACK_BANNERS[0].imageUrl;
          }
        }}
      />
      <div className="absolute inset-0 bg-linear-to-r from-background/80 via-background/50 to-transparent" />
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
          <span className="bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
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
            : "bg-primary/30 hover:bg-primary/50 backdrop-blur-xs"
        }`}
        aria-label={`Go to slide ${index + 1}`}
      />
    ))}
  </div>
));

SlideIndicator.displayName = "SlideIndicator";

const ProductCard = memo(({ product }: { product: Product }) => (
  <div className="group relative overflow-hidden rounded-xl glass-effect border-glass-border hover:border-primary/50 transition-all duration-500 theme-transition hover:scale-[1.02]">
    <div className="aspect-3/4 relative overflow-hidden">
      <img
        src={product.images[0]}
        alt={product.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
    <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-background via-background/95 to-transparent transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
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
    <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
      <WishlistHeartButton
        productId={product.id}
        snapshot={buildWishlistSnapshot(product)}
        size="sm"
      />
      <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold">
        NEW
      </span>
    </div>
  </div>
));

ProductCard.displayName = "ProductCard";

const GridItemCard = memo(({ item }: { item: (typeof gridItems)[0] }) => {
  const [imageSrc, setImageSrc] = useState(item.image);

  useEffect(() => {
    setImageSrc(item.image);
  }, [item.image]);

  return (
    <div className="group relative overflow-hidden rounded-xl glass-effect border-glass-border hover:neon-border transition-all duration-500 theme-transition">
      <div className="aspect-3/4 relative overflow-hidden">
        <img
          src={imageSrc}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          onError={(event) => {
            const element = event.currentTarget;
            if (element.src !== TILE_IMAGE_FALLBACK) {
              setImageSrc(TILE_IMAGE_FALLBACK);
            }
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent" />
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
  );
});

GridItemCard.displayName = "GridItemCard";

const SectionHeader = memo(({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="text-center space-y-3 mb-12">
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
      {title}
    </h2>
    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
      {subtitle}
    </p>
    <div className="w-24 h-1 bg-linear-to-r from-primary via-secondary to-accent mx-auto rounded-full" />
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
      .catch((error) => {
        sentryTracker(error, { source: "home-page", route: "/home" });
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
      <section className="py-16 md:py-20 lg:py-24 bg-linear-to-b from-background to-card/30">
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
                  className="flex-1 px-6 py-3 rounded-lg bg-white/10 backdrop-blur-xs border border-white/20 text-white placeholder-white/50 focus:outline-hidden focus:ring-2 focus:ring-primary-light focus:border-transparent"
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