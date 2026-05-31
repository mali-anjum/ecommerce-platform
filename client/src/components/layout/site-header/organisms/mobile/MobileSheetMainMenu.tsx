"use client";

import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/common/organisms/theme/ThemeToggler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SITE_HEADER_INFO_LINKS } from "@/components/layout/site-header/config/site-header-info-links";
import { SITE_HEADER_MAIN_NAV } from "@/components/layout/site-header/config/site-header-main-nav";

type MobileSheetMainMenuProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenAccount: () => void;
  onOpenCategories: () => void;
  onCloseSheet: () => void;
};

/** Mobile sheet root: search, nav links, info, account/cart/wishlist shortcuts. */
export function MobileSheetMainMenu({
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  cartCount,
  wishlistCount,
  onOpenAccount,
  onOpenCategories,
  onCloseSheet,
}: MobileSheetMainMenuProps) {
  const router = useRouter();

  return (
    <div className="space-y-6 py-2">
      <form onSubmit={onSearchSubmit} className="relative">
        <Input
          type="search"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="border-border bg-input pr-10"
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
        >
          <Search className="h-4 w-4" />
        </Button>
      </form>

      <div className="space-y-1">
        {SITE_HEADER_MAIN_NAV.map((navItem) => (
          <Button
            key={navItem.title}
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              onCloseSheet();
              router.push(navItem.to);
            }}
          >
            <span className="flex items-center">
              {navItem.icon}
              {navItem.title}
              {navItem.badge && (
                <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                  {navItem.badge}
                </span>
              )}
            </span>
          </Button>
        ))}

        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={onOpenCategories}
        >
          <span className="flex items-center">
            <Menu className="mr-2 h-4 w-4" />
            All Categories
          </span>
        </Button>
      </div>

      <div className="space-y-1">
        <h4 className="px-2 text-sm font-semibold text-muted-foreground">Information</h4>
        {SITE_HEADER_INFO_LINKS.map((item) => (
          <Button
            key={item.title}
            variant="ghost"
            className="w-full justify-start text-sm"
            onClick={() => {
              onCloseSheet();
              router.push(item.to);
            }}
          >
            {item.icon}
            {item.title}
          </Button>
        ))}
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <Button onClick={onOpenAccount} variant="outline" className="w-full">
          <User className="mr-2 h-4 w-4" />
          Account
        </Button>
        <ThemeToggle variant="menu" />

        <Button
          onClick={() => {
            onCloseSheet();
            router.push("/cart");
          }}
          className="w-full"
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Cart ({cartCount})
        </Button>

        <Button
          onClick={() => {
            onCloseSheet();
            router.push("/wishlist");
          }}
          variant="outline"
          className="w-full"
        >
          <Heart className="mr-2 h-4 w-4" />
          Wishlist ({wishlistCount})
        </Button>
      </div>
    </div>
  );
}
