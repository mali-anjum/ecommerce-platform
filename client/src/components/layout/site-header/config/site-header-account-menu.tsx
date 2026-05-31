import {
  Bookmark,
  Heart,
  MapPin,
  Package,
  User,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AccountMenuVisual } from "@/components/layout/site-header/types/site-header.types";

export const SITE_HEADER_ACCOUNT_LINKS = [
  { title: "My Account", to: "/account" },
  { title: "Orders", to: "/orders" },
  { title: "Wishlist", to: "/wishlist" },
  { title: "Saved Items", to: "/saved" },
  { title: "Addresses", to: "/account?tab=addresses" },
] as const;

export type AccountMenuTitle = //take the type of every element in the array
  (typeof SITE_HEADER_ACCOUNT_LINKS)[number]["title"];

export type AccountMenuLink = (typeof SITE_HEADER_ACCOUNT_LINKS)[number];

/** Icons and helper text for each account menu row in the profile dropdown. */
export const SITE_HEADER_ACCOUNT_MENU_VISUALS: Record<
  AccountMenuTitle,
  AccountMenuVisual
> = {
  "My Account": {
    icon: <User className="h-4 w-4 text-primary" />,
    helper: "Profile and preferences",
  },
  Orders: {
    icon: <Package className="h-4 w-4 text-primary" />,
    helper: "Track and manage purchases",
  },
  Wishlist: {
    icon: <Heart className="h-4 w-4 text-primary" />,
    helper: "Saved favorites",
  },
  "Saved Items": {
    icon: <Bookmark className="h-4 w-4 text-primary" />,
    helper: "Items for later",
  },
  Addresses: {
    icon: <MapPin className="h-4 w-4 text-primary" />,
    helper: "Delivery locations",
  },
};

export function getAccountMenuIcon(title: AccountMenuTitle): ReactNode {
  return (
    SITE_HEADER_ACCOUNT_MENU_VISUALS[title]?.icon ?? (
      <User className="h-4 w-4 text-primary" />
    )
  );
}

export function getAccountMenuHelper(title: AccountMenuTitle): string {
  return SITE_HEADER_ACCOUNT_MENU_VISUALS[title]?.helper ?? "Open section";
}
