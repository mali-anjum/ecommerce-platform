"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useSettingsStore } from "@/components/super-admin/state/useSettingsStore";
import type { Product } from "@/components/products/types/product";
import { API_ROUTES } from "@/lib/routes/api";
import { sentryTracker } from "@/lib/monitoring";
import { FALLBACK_BANNERS } from "../constants/homeContent";
import type { HomeBanner } from "../types/HomeBanner";

export function useHomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [catalogFallback, setCatalogFallback] = useState<Product[]>([]);
  const { banners, featuredProducts, fetchFeaturedProducts, fetchBanners } =
    useSettingsStore();

  const heroSlides: HomeBanner[] =
    banners.length > 0 ? banners : FALLBACK_BANNERS;

  useEffect(() => {
    void fetchBanners();
    void fetchFeaturedProducts();
  }, [fetchBanners, fetchFeaturedProducts]);

  useEffect(() => {
    if (featuredProducts.length > 0) return;

    let cancelled = false;
    axios
      .get(`${API_ROUTES.PRODUCTS}/fetch-client-products`, {
        params: {
          limit: 8,
          page: 1,
          sortBy: "createdAt",
          sortOrder: "desc",
        },
        withCredentials: true,
      })
      .then((response) => {
        const data = response.data?.data ?? response.data;
        const products = data?.products ?? [];
        if (!cancelled && Array.isArray(products)) {
          setCatalogFallback(products as Product[]);
        }
      })
      .catch((error: unknown) => {
        sentryTracker(error, { source: "home-page", route: "/home" });
      });

    return () => {
      cancelled = true;
    };
  }, [featuredProducts.length]);

  useEffect(() => {
    const bannerTimer = window.setInterval(() => {
      setCurrentSlide((previous) => (previous + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(bannerTimer);
  }, [heroSlides.length]);

  const showcaseProducts: Product[] =
    featuredProducts.length > 0
      ? (featuredProducts as unknown as Product[])
      : catalogFallback;

  const changeSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  return {
    heroSlides,
    currentSlide,
    changeSlide,
    showcaseProducts,
  };
}
