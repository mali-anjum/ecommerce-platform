"use client";

import { ChevronDown, HelpCircle } from "lucide-react";
import Link from "next/link";
import type { ProductCategory } from "@/components/products/types/category";
import { SITE_HEADER_MAIN_NAV } from "@/components/layout/site-header/config/site-header-main-nav";

type HeaderDesktopNavBarProps = {
  categories: ProductCategory[];
};

/** Bottom desktop row: main nav links, shop mega-menu, help links. */
export function HeaderDesktopNavBar({ categories }: HeaderDesktopNavBarProps) {
  return (
    <div className="hidden items-center justify-between py-3 lg:flex">
      <nav className="flex items-center space-x-6">
        {SITE_HEADER_MAIN_NAV.map((item) => (
          <div key={item.title} className="group relative">
            <Link
              href={item.to}
              className="flex items-center text-sm font-medium transition-colors hover:text-primary"
            >
              {item.icon}
              {item.title}
              {item.badge && (
                <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                  {item.badge}
                </span>
              )}
              {item.megaMenu && <ChevronDown className="ml-1 h-3 w-3" />}
            </Link>

            {item.megaMenu && (
              <div className="invisible absolute left-0 top-full z-50 w-screen max-w-4xl rounded-xl border border-border bg-card p-6 opacity-0 shadow-2xl transition-all duration-300 group-hover:visible group-hover:opacity-100">
                <div className="grid grid-cols-4 gap-6">
                  {categories.map((category) => (
                    <div key={category.title} className="space-y-2">
                      <h4 className="mb-2 font-semibold text-foreground">
                        {category.title}
                      </h4>
                      <ul className="space-y-1">
                        {category.subcategories.map((sub) => (
                          <li key={sub.title}>
                            <Link
                              href={`/products?mainCategory=${encodeURIComponent(category.title)}&subcategory=${encodeURIComponent(sub.title)}`}
                              className="text-sm text-muted-foreground hover:text-primary"
                            >
                              {sub.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="flex items-center space-x-4 text-sm">
        <Link href="/help" className="text-muted-foreground hover:text-foreground">
          <HelpCircle className="mr-1 inline h-4 w-4" />
          Help
        </Link>
        <Link
          href="/track-order"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Track Order
        </Link>
        <a
          href="tel:1800388873"
          className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          24/7 Support: 1-800-FUTURE
        </a>
      </div>
    </div>
  );
}
