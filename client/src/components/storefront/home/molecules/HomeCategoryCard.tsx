"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TILE_IMAGE_FALLBACK } from "../constants/homeContent";
import type { HomeCategory } from "../types/HomeCategory";

type HomeCategoryCardProps = {
  category: HomeCategory;
};

export function HomeCategoryCard({ category }: HomeCategoryCardProps) {
  const [imageSrc, setImageSrc] = useState(category.image);

  return (
    <div className="group relative overflow-hidden rounded-xl border-glass-border glass-effect transition-all duration-500 theme-transition hover:neon-border">
      <div className="relative aspect-3/4 overflow-hidden">
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          unoptimized={imageSrc === TILE_IMAGE_FALLBACK}
          onError={() => {
            if (imageSrc !== TILE_IMAGE_FALLBACK) {
              setImageSrc(TILE_IMAGE_FALLBACK);
            }
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent" />
        <div className="hologram-effect absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 theme-transition group-hover:opacity-100">
        <div className="rounded-xl border-glass-border bg-glass p-8 text-center backdrop-blur-glass">
          <h3 className="text-2xl font-bold text-foreground">{category.title}</h3>
          <p className="mt-4 text-muted-foreground">{category.subtitle}</p>
          <Button
            asChild
            className="mt-4 rounded-lg bg-primary px-6 text-primary-foreground transition-transform duration-300 hover:scale-105 hover:bg-primary-light"
          >
            <Link href={category.shopHref}>SHOP NOW</Link>
          </Button>
        </div>
      </div>
      <div className="absolute bottom-6 left-6">
        <h3 className="text-2xl font-bold text-foreground">{category.title}</h3>
        <p className="text-sm text-muted-foreground">{category.subtitle}</p>
      </div>
    </div>
  );
}
