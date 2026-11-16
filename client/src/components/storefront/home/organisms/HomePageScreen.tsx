"use client";

import { HomeFloatingParticles } from "../atoms/HomeFloatingParticles";
import { useHomePage } from "../hooks/useHomePage";
import { HomeCategorySection } from "./HomeCategorySection";
import { HomeCommunitySection } from "./HomeCommunitySection";
import { HomeFeaturedProductsSection } from "./HomeFeaturedProductsSection";
import { HomeHeroSection } from "./HomeHeroSection";

export function HomePageScreen() {
  const { heroSlides, currentSlide, changeSlide, showcaseProducts } =
    useHomePage();

  return (
    <div className="min-h-screen bg-background text-foreground theme-transition">
      <HomeHeroSection
        banners={heroSlides}
        currentSlide={currentSlide}
        onSlideChange={changeSlide}
      />
      <HomeCategorySection />
      <HomeFeaturedProductsSection products={showcaseProducts} />
      <HomeCommunitySection />
      <HomeFloatingParticles />
    </div>
  );
}
