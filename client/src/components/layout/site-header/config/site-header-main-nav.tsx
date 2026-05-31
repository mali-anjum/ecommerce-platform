import {
  ShoppingBag,
  Star,
  TrendingUp,
} from "lucide-react";
import type { HeaderNavItem } from "@/components/layout/site-header/types/site-header.types";

/** Primary desktop + mobile navigation links (Home, Shop, New Arrivals). */
export const SITE_HEADER_MAIN_NAV: HeaderNavItem[] = [
  {
    title: "HOME",
    to: "/",
    icon: <TrendingUp className="mr-2 h-4 w-4" />,
  },
  {
    title: "SHOP",
    to: "/products",
    icon: <ShoppingBag className="mr-2 h-4 w-4" />,
    megaMenu: true,
  },
  {
    title: "NEW ARRIVALS",
    to: "/new-arrivals",
    icon: <Star className="mr-2 h-4 w-4" />,
    badge: "HOT",
  },
];
