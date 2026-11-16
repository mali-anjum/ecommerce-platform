import { HOME_CATEGORIES } from "../constants/homeContent";
import { HomeCategoryCard } from "../molecules/HomeCategoryCard";
import { HomeSectionHeader } from "../molecules/HomeSectionHeader";

export function HomeCategorySection() {
  return (
    <section className="py-16 md:py-20 lg:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <HomeSectionHeader
          title="Shop by category"
          subtitle="Browse our Electronics, Fashion, Home & Living, and Beauty departments—like leading storefronts."
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {HOME_CATEGORIES.map((category) => (
            <HomeCategoryCard key={category.title} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
