"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SITE_HEADER_LANGUAGE_OPTIONS,
  type SiteHeaderLanguageLabel,
  type SiteHeaderLocale,
} from "@/components/layout/site-header/config/site-header-languages";

type HeaderPromoTopBarProps = {
  selectedLanguage: SiteHeaderLanguageLabel;
  onLanguageSelect: (value: SiteHeaderLocale) => void;
};

/** Thin promo strip above the main header (shipping banner + language picker). */
export function HeaderPromoTopBar({
  selectedLanguage,
  onLanguageSelect,
}: HeaderPromoTopBarProps) {
  return (
    <div className="border-b border-primary/20 bg-primary/10">
      <div className="container mx-auto px-4">
        <div className="flex h-8 items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="animate-pulse font-medium text-primary">
              🚀 Free shipping on orders over $50
            </span>
            <span className="hidden text-muted-foreground md:inline">
              New collection just dropped!
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7">
                  <Globe className="mr-1 h-3 w-3" />
                  {selectedLanguage}
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {SITE_HEADER_LANGUAGE_OPTIONS.map((language) => (
                  <DropdownMenuItem
                    key={language.value}
                    onClick={() => onLanguageSelect(language.value)}
                    className="flex items-center justify-between gap-3"
                  >
                    {language.label}
                    {selectedLanguage === language.label && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              href="/contact"
              className="hidden text-sm text-muted-foreground hover:text-foreground md:inline"
            >
              Contact: support@futureshop.com
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
