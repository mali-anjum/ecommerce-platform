import type { Product } from "@/components/products/types/product";
import { HomeProductLoadingState } from "../atoms/HomeProductLoadingState";
import { HomeProductCard } from "../molecules/HomeProductCard";
import { HomeSectionHeader } from "../molecules/HomeSectionHeader";

type HomeFeaturedProductsSectionProps = {
  products: Product[];
};

export function HomeFeaturedProductsSection({
  products,
}: HomeFeaturedProductsSectionProps) {
  return (
    <section className="bg-linear-to-b from-background to-card/30 py-16 md:py-20 lg:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <HomeSectionHeader
          title="Featured picks"
          subtitle="Staff picks and bestsellers—mirroring “featured collection” strips on Amazon and Shopify storefronts."
        />
        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
            {products.map((product) => (
              <HomeProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <HomeProductLoadingState />
        )}
      </div>
    </section>
  );
}
