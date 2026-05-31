"use client";

import Link from "next/link";
import { Menu, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { User as AuthUser } from "@/types/auth/User";
import type { ProductCategory } from "@/types/category";
import type { MobileSheetView } from "@/components/layout/site-header/types/site-header.types";
import { MobileSheetAccountPanel } from "./MobileSheetAccountPanel";
import { MobileSheetCategoriesPanel } from "./MobileSheetCategoriesPanel";
import { MobileSheetMainMenu } from "./MobileSheetMainMenu";

type HeaderMobileNavSheetProps = {
  user: AuthUser | null;
  categories: ProductCategory[];
  cartCount: number;
  wishlistCount: number;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onLogout: () => void;
};

/** Mobile hamburger menu: sheet with main / account / categories views. */
export function HeaderMobileNavSheet({
  user,
  categories,
  cartCount,
  wishlistCount,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  onLogout,
}: HeaderMobileNavSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<MobileSheetView>("menu");

  const closeSheet = () => setOpen(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setView("menu");
  };

  const renderView = () => {
    switch (view) {
      case "account":
        return (
          <MobileSheetAccountPanel
            user={user}
            onBack={() => setView("menu")}
            onCloseSheet={closeSheet}
            onLogout={onLogout}
          />
        );
      case "categories":
        return (
          <MobileSheetCategoriesPanel
            categories={categories}
            onBack={() => setView("menu")}
            onCloseSheet={closeSheet}
          />
        );
      default:
        return (
          <MobileSheetMainMenu
            searchQuery={searchQuery}
            onSearchQueryChange={onSearchQueryChange}
            onSearchSubmit={onSearchSubmit}
            cartCount={cartCount}
            wishlistCount={wishlistCount}
            onOpenAccount={() => setView("account")}
            onOpenCategories={() => setView("categories")}
            onCloseSheet={closeSheet}
          />
        );
    }
  };

  return (
    <div className="flex items-center space-x-2 lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => router.push("/cart")}
      >
        <ShoppingCart className="h-5 w-5" />
        {cartCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {cartCount}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <Button size="icon" variant="ghost">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85vw] sm:w-96">
          <SheetHeader>
            <SheetTitle className="flex items-center">
              <Link href="/" onClick={closeSheet}>
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-xl font-bold text-transparent">
                  FUTURESHOP
                </span>
              </Link>
            </SheetTitle>
          </SheetHeader>
          {renderView()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
