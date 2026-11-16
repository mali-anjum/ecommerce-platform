import { HomeSlideIndicator } from "../atoms/HomeSlideIndicator";
import { HomeBannerSlide } from "../molecules/HomeBannerSlide";
import type { HomeBanner } from "../types/HomeBanner";

type HomeHeroSectionProps = {
  banners: HomeBanner[];
  currentSlide: number;
  onSlideChange: (index: number) => void;
};

export function HomeHeroSection({
  banners,
  currentSlide,
  onSlideChange,
}: HomeHeroSectionProps) {
  const activeSlide = currentSlide % banners.length;

  return (
    <section
      className="relative h-[600px] overflow-hidden md:h-[700px] lg:h-[800px]"
      aria-label="Featured collection"
    >
      {banners.map((banner, index) => (
        <HomeBannerSlide
          key={banner.id}
          banner={banner}
          isActive={activeSlide === index}
        />
      ))}

      <HomeSlideIndicator
        count={banners.length}
        current={activeSlide}
        onChange={onSlideChange}
      />

      <div
        className="absolute left-10 top-1/4 h-4 w-4 animate-pulse rounded-full bg-primary/20"
        aria-hidden="true"
      />
      <div
        className="absolute right-20 top-1/3 h-6 w-6 animate-float rounded-full bg-secondary/20"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 left-1/4 h-3 w-3 animate-pulse rounded-full bg-accent/20 animation-delay-1000"
        aria-hidden="true"
      />
    </section>
  );
}
