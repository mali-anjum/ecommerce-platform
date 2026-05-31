"use client";

import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/common/organisms/theme/ThemeToggler";
import { useAuthStore } from "@/components/auth/state/useAuthStore";
import { HeaderAccountDropdown } from "@/components/layout/site-header/organisms/HeaderAccountDropdown";
import { HeaderBrandLogo } from "@/components/layout/site-header/atoms/HeaderBrandLogo";
import { HeaderDesktopNavBar } from "@/components/layout/site-header/organisms/HeaderDesktopNavBar";
import { HeaderDesktopQuickActions } from "@/components/layout/site-header/molecules/HeaderDesktopQuickActions";
import { HeaderDesktopSearchBar } from "@/components/layout/site-header/molecules/HeaderDesktopSearchBar";
import { HeaderPromoTopBar } from "@/components/layout/site-header/molecules/HeaderPromoTopBar";
import { useSiteHeaderCartWishlist } from "@/components/layout/site-header/hooks/useSiteHeaderCartWishlist";
import { useSiteHeaderLanguage } from "@/components/layout/site-header/hooks/useSiteHeaderLanguage";
import { useSiteHeaderSearch } from "@/components/layout/site-header/hooks/useSiteHeaderSearch";
import { HeaderMobileNavSheet } from "@/components/layout/site-header/organisms/mobile/HeaderMobileNavSheet";

/** Main storefront header — composes promo bar, search, nav, account, and mobile sheet. */
export default function SiteHeader() {
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const { selectedLanguage, selectLanguage } = useSiteHeaderLanguage();
  const { cartCount, wishlistCount } = useSiteHeaderCartWishlist();
  const {
    categories,
    searchQuery,
    setSearchQuery,
    selectedDepartment,
    departmentOptions,
    handleSearch,
    handleDepartmentSelect,
  } = useSiteHeaderSearch();

  async function handleLogout() {
    await logout();
    router.push("/auth/login");
  }

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-glass-border backdrop-blur-sm">
      <HeaderPromoTopBar
        selectedLanguage={selectedLanguage}
        onLanguageSelect={selectLanguage}
      />

      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <HeaderBrandLogo />

          <HeaderDesktopSearchBar
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            selectedDepartment={selectedDepartment}
            onDepartmentSelect={handleDepartmentSelect}
            departmentOptions={departmentOptions}
            onSubmit={handleSearch}
          />

          <div className="hidden items-center space-x-2 lg:flex">
            <HeaderDesktopQuickActions
              wishlistCount={wishlistCount}
              cartCount={cartCount}
            />
            <HeaderAccountDropdown user={user} onLogout={() => void handleLogout()} />
            <div className="hidden xl:block">
              <ThemeToggle />
            </div>
          </div>

          <HeaderMobileNavSheet
            user={user}
            categories={categories}
            cartCount={cartCount}
            wishlistCount={wishlistCount}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSearchSubmit={handleSearch}
            onLogout={() => void handleLogout()}
          />
        </div>

        <HeaderDesktopNavBar categories={categories} />
      </div>
    </header>
  );
}
