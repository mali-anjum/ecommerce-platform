import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Product } from "@/components/products/types/product";
import { WishlistHeartButton } from "@/components/storefront/wishlist/atoms/WishlistHeartButton";
import { buildWishlistSnapshot } from "@/components/storefront/wishlist/utils/wishlistSnapshot";
import { TILE_IMAGE_FALLBACK } from "../constants/homeContent";

type HomeProductCardProps = {
  product: Product;
};

function formatPrice(value: number | string | undefined): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "number") return `$${value.toFixed(2)}`;
  return String(value);
}

export function HomeProductCard({ product }: HomeProductCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-xl border-glass-border glass-effect transition-all duration-500 theme-transition hover:scale-[1.02] hover:border-primary/50">
      <div className="relative aspect-3/4 overflow-hidden">
        <Image
          src={product.images[0] || TILE_IMAGE_FALLBACK}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          unoptimized={!product.images[0]}
        />
        <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 translate-y-full bg-linear-to-t from-background via-background/95 to-transparent p-6 transition-transform duration-500 group-hover:translate-y-0">
        <div className="space-y-3 text-center">
          <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
          <p className="text-xl font-bold text-primary">
            {formatPrice(product.price)}
          </p>
          <div className="flex justify-center gap-2">
            <Button
              asChild
              className="rounded-lg bg-primary px-6 text-primary-foreground transition-all duration-300 hover:scale-105 hover:bg-primary-light"
            >
              <Link href={`/products/${product.id}`}>QUICK VIEW</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-lg border-primary/30 text-primary hover:bg-primary/10"
            >
              <Link href={`/products/${product.id}`}>VIEW</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute right-4 top-4 z-10 flex flex-col items-end gap-2">
        <WishlistHeartButton
          productId={product.id}
          snapshot={buildWishlistSnapshot(product)}
          size="sm"
        />
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          NEW
        </span>
      </div>
    </article>
  );
}
