"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FALLBACK_BANNERS } from "../constants/homeContent";
import type { HomeBanner } from "../types/HomeBanner";

type HomeBannerSlideProps = {
  banner: HomeBanner;
  isActive: boolean;
};

export function HomeBannerSlide({ banner, isActive }: HomeBannerSlideProps) {
  const [imageSrc, setImageSrc] = useState(banner.imageUrl);
  const fallbackImage = FALLBACK_BANNERS[0].imageUrl;

  return (
    <div
      className={`absolute inset-0 transition-all duration-1000 theme-transition ${
        isActive ? "z-10 opacity-100" : "z-0 opacity-0"
      }`}
      aria-hidden={!isActive}
      inert={!isActive}
    >
      <div className="absolute inset-0">
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          loading={isActive ? "eager" : "lazy"}
          unoptimized={imageSrc === fallbackImage}
          onError={() => {
            if (imageSrc !== fallbackImage) {
              setImageSrc(fallbackImage);
            }
          }}
        />
        <div className="absolute inset-0 bg-linear-to-r from-background/80 via-background/50 to-transparent" />
        <div className="cosmic-gradient absolute inset-0 opacity-20" />
      </div>
      <div className="container relative mx-auto flex h-full items-center px-4">
        <div className="max-w-2xl space-y-6">
          <span className="text-glow text-sm font-semibold uppercase tracking-wider text-primary">
            MERIDIAN COMMERCE
          </span>
          <h1 className="text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-7xl">
            ENTERPRISE
            <br />
            <span className="bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              COMMERCE
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            One platform for discovery, orders, and growth—built for modern
            commerce teams.
          </p>
          <Button
            asChild
            className="glass-effect neon-border rounded-lg border-glass-border bg-primary px-8 py-6 text-lg text-primary-foreground transition-transform duration-300 hover:scale-105 hover:bg-primary-light"
          >
            <Link href="/products">SHOP NOW</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
