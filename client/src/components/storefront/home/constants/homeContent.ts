import { seededRandomRows } from "@/lib/seededRandom";
import type { HomeBanner } from "../types/HomeBanner";
import type { HomeCategory } from "../types/HomeCategory";

export const FALLBACK_BANNERS: HomeBanner[] = [
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

export const HOME_CATEGORIES: HomeCategory[] = [
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

export const TILE_IMAGE_FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='1600' viewBox='0 0 1200 1600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%230f172a'/><stop offset='100%' stop-color='%23334155'/></linearGradient></defs><rect width='1200' height='1600' fill='url(%23g)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23e2e8f0' font-size='62' font-family='Arial, sans-serif'>Category Image</text></svg>";

export const HOME_PARTICLES = seededRandomRows(20, 6, 12);
