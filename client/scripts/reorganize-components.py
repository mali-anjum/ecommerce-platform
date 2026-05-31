#!/usr/bin/env python3
"""One-time component folder reorganization: atomic design + storefront merge."""

from __future__ import annotations

import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
COMPONENTS = ROOT / "components"

# old path (relative to components/) -> new path (relative to components/)
MOVES: list[tuple[str, str]] = [
    # --- common: atomic theme + app shell ---
    ("common/layout.tsx", "common/organisms/AppShell.tsx"),
    ("common/ThemeToggler.tsx", "common/organisms/theme/ThemeToggler.tsx"),
    ("common/theme/ThemeIconStack.tsx", "common/atoms/theme/ThemeIconStack.tsx"),
    ("common/theme/ThemeMenuRow.tsx", "common/molecules/theme/ThemeMenuRow.tsx"),
    ("common/theme/ThemeToggleDesktop.tsx", "common/molecules/theme/ThemeToggleDesktop.tsx"),
    ("common/theme/ThemeSegmentedControl.tsx", "common/molecules/theme/ThemeSegmentedControl.tsx"),
    # --- auth ---
    ("auth/FormInput.tsx", "auth/atoms/FormInput.tsx"),
    ("auth/LoadingButton.tsx", "auth/atoms/LoadingButton.tsx"),
    ("auth/SecurityBadge.tsx", "auth/atoms/SecurityBadge.tsx"),
    ("auth/WarmupStatus.tsx", "auth/atoms/WarmupStatus.tsx"),
    ("auth/ThemeTogglerPlaceHolder.tsx", "auth/atoms/ThemeTogglerPlaceHolder.tsx"),
    ("auth/PasswordStrengthIndicator.tsx", "auth/molecules/PasswordStrengthIndicator.tsx"),
    ("auth/BenefitsGrid.tsx", "auth/molecules/BenefitsGrid.tsx"),
    ("auth/FeaturesGrid.tsx", "auth/molecules/FeaturesGrid.tsx"),
    ("auth/LoginBanner.tsx", "auth/molecules/LoginBanner.tsx"),
    ("auth/LoginForm.tsx", "auth/organisms/LoginForm.tsx"),
    ("auth/RegisterForm.tsx", "auth/organisms/RegisterForm.tsx"),
    # --- products listing ---
    ("products/listing/ProductsBackToTopFab.tsx", "products/listing/atoms/ProductsBackToTopFab.tsx"),
    ("products/listing/ProductsActiveFiltersBanner.tsx", "products/listing/molecules/ProductsActiveFiltersBanner.tsx"),
    ("products/listing/ProductsResultsSummary.tsx", "products/listing/molecules/ProductsResultsSummary.tsx"),
    ("products/listing/ProductsCollectionTabs.tsx", "products/listing/molecules/ProductsCollectionTabs.tsx"),
    ("products/listing/ProductsLoadMoreButton.tsx", "products/listing/molecules/ProductsLoadMoreButton.tsx"),
    ("products/listing/ProductsFetchErrorState.tsx", "products/listing/molecules/ProductsFetchErrorState.tsx"),
    ("products/listing/ProductsEmptyState.tsx", "products/listing/molecules/ProductsEmptyState.tsx"),
    ("products/listing/ProductsFiltersSidebar.tsx", "products/listing/molecules/ProductsFiltersSidebar.tsx"),
    ("products/listing/ProductsHeroBanner.tsx", "products/listing/organisms/ProductsHeroBanner.tsx"),
    ("products/listing/ProductsListingMain.tsx", "products/listing/organisms/ProductsListingMain.tsx"),
    ("products/listing/products-listing.utils.ts", "products/listing/utils/products-listing.utils.ts"),
    # --- products root ---
    ("products/ProductTableSkeleton.tsx", "products/atoms/ProductTableSkeleton.tsx"),
    ("products/productPricing.ts", "products/utils/productPricing.ts"),
    ("products/ProductFilters.tsx", "products/molecules/ProductFilters.tsx"),
    ("products/ProductPagination.tsx", "products/molecules/ProductPagination.tsx"),
    ("products/ProductGrid.tsx", "products/organisms/ProductGrid.tsx"),
    ("products/ProductManagementList.tsx", "products/organisms/ProductManagementList.tsx"),
    # --- site-header ---
    ("layout/site-header/HeaderBrandLogo.tsx", "layout/site-header/atoms/HeaderBrandLogo.tsx"),
    ("layout/site-header/mobile/MobileSheetBackHeader.tsx", "layout/site-header/atoms/MobileSheetBackHeader.tsx"),
    ("layout/site-header/HeaderPromoTopBar.tsx", "layout/site-header/molecules/HeaderPromoTopBar.tsx"),
    ("layout/site-header/HeaderDesktopSearchBar.tsx", "layout/site-header/molecules/HeaderDesktopSearchBar.tsx"),
    ("layout/site-header/HeaderDesktopQuickActions.tsx", "layout/site-header/molecules/HeaderDesktopQuickActions.tsx"),
    ("layout/site-header/HeaderAccountDropdown.tsx", "layout/site-header/organisms/HeaderAccountDropdown.tsx"),
    ("layout/site-header/HeaderDesktopNavBar.tsx", "layout/site-header/organisms/HeaderDesktopNavBar.tsx"),
    ("layout/site-header/SiteHeader.tsx", "layout/site-header/organisms/SiteHeader.tsx"),
    ("layout/site-header/mobile/HeaderMobileNavSheet.tsx", "layout/site-header/organisms/mobile/HeaderMobileNavSheet.tsx"),
    ("layout/site-header/mobile/MobileSheetAccountPanel.tsx", "layout/site-header/organisms/mobile/MobileSheetAccountPanel.tsx"),
    ("layout/site-header/mobile/MobileSheetCategoriesPanel.tsx", "layout/site-header/organisms/mobile/MobileSheetCategoriesPanel.tsx"),
    ("layout/site-header/mobile/MobileSheetMainMenu.tsx", "layout/site-header/organisms/mobile/MobileSheetMainMenu.tsx"),
    ("layout/site-header/site-header.types.ts", "layout/site-header/types/site-header.types.ts"),
    # --- storefront merge (user + wishlist + orders) ---
    ("user/cart/CartCheckbox.tsx", "storefront/cart/atoms/CartCheckbox.tsx"),
    ("user/cart/CartLoadingSkeleton.tsx", "storefront/cart/atoms/CartLoadingSkeleton.tsx"),
    ("user/cart/CartItem.tsx", "storefront/cart/molecules/CartItem.tsx"),
    ("user/cart/CartSummary.tsx", "storefront/cart/organisms/CartSummary.tsx"),
    ("user/cart/CartEmptyState.tsx", "storefront/cart/organisms/CartEmptyState.tsx"),
    ("user/cart/CartRedirect.tsx", "storefront/cart/organisms/CartRedirect.tsx"),
    ("user/cart/cartTotals.ts", "storefront/cart/utils/cartTotals.ts"),
    ("user/cart/hooks/useCartSelection.ts", "storefront/cart/hooks/useCartSelection.ts"),
    ("user/checkout/FuturisticCheckoutLoader.tsx", "storefront/checkout/atoms/FuturisticCheckoutLoader.tsx"),
    ("user/checkout/CheckoutLoadingState.tsx", "storefront/checkout/atoms/CheckoutLoadingState.tsx"),
    ("user/checkout/CheckoutSkeleton.tsx", "storefront/checkout/atoms/CheckoutSkeleton.tsx"),
    ("user/checkout/AddressSkeleton.tsx", "storefront/checkout/atoms/AddressSkeleton.tsx"),
    ("user/checkout/PaymentProcessing.tsx", "storefront/checkout/atoms/PaymentProcessing.tsx"),
    ("user/checkout/CheckoutProgress.tsx", "storefront/checkout/molecules/CheckoutProgress.tsx"),
    ("user/checkout/PaymentMethods.tsx", "storefront/checkout/molecules/PaymentMethods.tsx"),
    ("user/checkout/CheckoutSecurityCard.tsx", "storefront/checkout/molecules/CheckoutSecurityCard.tsx"),
    ("user/checkout/CheckoutSupportCard.tsx", "storefront/checkout/molecules/CheckoutSupportCard.tsx"),
    ("user/checkout/CheckoutHeader.tsx", "storefront/checkout/molecules/CheckoutHeader.tsx"),
    ("user/checkout/CheckoutOrderSummary.tsx", "storefront/checkout/molecules/CheckoutOrderSummary.tsx"),
    ("user/checkout/CheckoutLeftPanel.tsx", "storefront/checkout/organisms/CheckoutLeftPanel.tsx"),
    ("user/checkout/CheckoutRightPanel.tsx", "storefront/checkout/organisms/CheckoutRightPanel.tsx"),
    ("user/checkout/CheckoutEmptyState.tsx", "storefront/checkout/organisms/CheckoutEmptyState.tsx"),
    ("user/checkout/CheckoutSuccessRedirect.tsx", "storefront/checkout/organisms/CheckoutSuccessRedirect.tsx"),
    ("user/checkout/CheckoutComponent.tsx", "storefront/checkout/organisms/CheckoutComponent.tsx"),
    ("user/checkout/PayPalProviderWrapper.tsx", "storefront/checkout/organisms/PayPalProviderWrapper.tsx"),
    ("user/checkout/checkoutUtils.ts", "storefront/checkout/utils/checkoutUtils.ts"),
    ("user/checkout/hooks/useCheckoutAddress.ts", "storefront/checkout/hooks/useCheckoutAddress.ts"),
    ("user/checkout/hooks/useCheckoutCart.ts", "storefront/checkout/hooks/useCheckoutCart.ts"),
    ("user/checkout/hooks/useCheckoutCoupon.ts", "storefront/checkout/hooks/useCheckoutCoupon.ts"),
    ("user/checkout/hooks/useCheckoutData.ts", "storefront/checkout/hooks/useCheckoutData.ts"),
    ("user/checkout/hooks/useCheckoutPayment.ts", "storefront/checkout/hooks/useCheckoutPayment.ts"),
    ("user/checkout/hooks/usePaymentMethods.ts", "storefront/checkout/hooks/usePaymentMethods.ts"),
    ("wishlist/WishlistHeartButton.tsx", "storefront/wishlist/atoms/WishlistHeartButton.tsx"),
    ("wishlist/WishlistCtaButton.tsx", "storefront/wishlist/atoms/WishlistCtaButton.tsx"),
    ("wishlist/WishlistLoadingSkeleton.tsx", "storefront/wishlist/atoms/WishlistLoadingSkeleton.tsx"),
    ("wishlist/wishlistSnapshot.ts", "storefront/wishlist/utils/wishlistSnapshot.ts"),
    ("wishlist/WishlistItemCard.tsx", "storefront/wishlist/molecules/WishlistItemCard.tsx"),
    ("wishlist/WishlistSummary.tsx", "storefront/wishlist/molecules/WishlistSummary.tsx"),
    ("wishlist/WishlistEmptyState.tsx", "storefront/wishlist/organisms/WishlistEmptyState.tsx"),
    ("orders/OrderStatusBadge.tsx", "storefront/orders/atoms/OrderStatusBadge.tsx"),
    ("orders/orderFilters.ts", "storefront/orders/utils/orderFilters.ts"),
    ("orders/OrderTimeline.tsx", "storefront/orders/molecules/OrderTimeline.tsx"),
    ("orders/OrderEventTimeline.tsx", "storefront/orders/molecules/OrderEventTimeline.tsx"),
    ("orders/OrderHorizontalStepper.tsx", "storefront/orders/molecules/OrderHorizontalStepper.tsx"),
    ("orders/OrderStatusTabs.tsx", "storefront/orders/molecules/OrderStatusTabs.tsx"),
    ("orders/OrderList.tsx", "storefront/orders/organisms/OrderList.tsx"),
    ("orders/AccountOrdersSidebar.tsx", "storefront/orders/organisms/AccountOrdersSidebar.tsx"),
    ("orders/OrderDetailsPanel.tsx", "storefront/orders/organisms/OrderDetailsPanel.tsx"),
]

IMPORT_REPLACEMENTS: list[tuple[str, str]] = []
for old, new in MOVES:
    old_import = f"@/components/{old.replace('.tsx', '').replace('.ts', '')}"
    new_import = f"@/components/{new.replace('.tsx', '').replace('.ts', '')}"
    if old.endswith(".tsx"):
        old_import_tsx = old_import
        old_import_ts = old_import
    IMPORT_REPLACEMENTS.append((old_import, new_import))

# Additional explicit import path updates (order matters: longest first)
EXTRA_REPLACEMENTS = [
    ("@/components/common/layout", "@/components/common/organisms/AppShell"),
    ("@/components/common/ThemeToggler", "@/components/common/organisms/theme/ThemeToggler"),
    ("@/components/common/theme/ThemeIconStack", "@/components/common/atoms/theme/ThemeIconStack"),
    ("@/components/common/theme/ThemeMenuRow", "@/components/common/molecules/theme/ThemeMenuRow"),
    ("@/components/common/theme/ThemeToggleDesktop", "@/components/common/molecules/theme/ThemeToggleDesktop"),
    ("@/components/common/theme/ThemeSegmentedControl", "@/components/common/molecules/theme/ThemeSegmentedControl"),
    ("@/components/products/listing/products-listing.utils", "@/components/products/listing/utils/products-listing.utils"),
    ("@/components/products/ProductTableSkeleton", "@/components/products/atoms/ProductTableSkeleton"),
    ("@/components/products/ProductPagination", "@/components/products/molecules/ProductPagination"),
    ("@/components/products/ProductFilters", "@/components/products/molecules/ProductFilters"),
    ("@/components/products/ProductGrid", "@/components/products/organisms/ProductGrid"),
    ("@/components/products/ProductManagementList", "@/components/products/organisms/ProductManagementList"),
    ("@/components/layout/site-header/mobile/", "@/components/layout/site-header/organisms/mobile/"),
    ("@/components/layout/site-header/site-header.types", "@/components/layout/site-header/types/site-header.types"),
    ("@/components/user/", "@/components/storefront/"),
    ("@/components/wishlist/", "@/components/storefront/wishlist/"),
    ("@/components/orders/", "@/components/storefront/orders/"),
    ("../../components/user/", "../../components/storefront/"),
    ("../../components/wishlist/", "../../components/storefront/wishlist/"),
    ("../user/", "../storefront/"),
    ("../wishlist/", "../storefront/wishlist/"),
    ("./ThemeIconStack", "@/components/common/atoms/theme/ThemeIconStack"),
    ("./ThemeMenuRow", "@/components/common/molecules/theme/ThemeMenuRow"),
    ("./ThemeToggleDesktop", "@/components/common/molecules/theme/ThemeToggleDesktop"),
    ("./ThemeSegmentedControl", "@/components/common/molecules/theme/ThemeSegmentedControl"),
    ("../theme/ThemeToggler", "@/components/common/organisms/theme/ThemeToggler"),
    ("../common/ThemeToggler", "@/components/common/organisms/theme/ThemeToggler"),
    ("@/components/common/theme/", "@/components/common/molecules/theme/"),
]

# Per-file listing imports
LISTING_MAP = {
    "ProductsBackToTopFab": "atoms",
    "ProductsActiveFiltersBanner": "molecules",
    "ProductsResultsSummary": "molecules",
    "ProductsCollectionTabs": "molecules",
    "ProductsLoadMoreButton": "molecules",
    "ProductsFetchErrorState": "molecules",
    "ProductsEmptyState": "molecules",
    "ProductsFiltersSidebar": "molecules",
    "ProductsHeroBanner": "organisms",
    "ProductsListingMain": "organisms",
}
for name, sub in LISTING_MAP.items():
    EXTRA_REPLACEMENTS.append(
        (f"@/components/products/listing/{name}", f"@/components/products/listing/{sub}/{name}")
    )

SITE_HEADER_MAP = {
    "HeaderBrandLogo": "atoms",
    "MobileSheetBackHeader": "atoms",
    "HeaderPromoTopBar": "molecules",
    "HeaderDesktopSearchBar": "molecules",
    "HeaderDesktopQuickActions": "molecules",
    "HeaderAccountDropdown": "organisms",
    "HeaderDesktopNavBar": "organisms",
    "SiteHeader": "organisms",
}
for name, sub in SITE_HEADER_MAP.items():
    EXTRA_REPLACEMENTS.append(
        (f"@/components/layout/site-header/{name}", f"@/components/layout/site-header/{sub}/{name}")
    )
    if name == "MobileSheetBackHeader":
        EXTRA_REPLACEMENTS.append(
            ("@/components/layout/site-header/mobile/MobileSheetBackHeader",
             "@/components/layout/site-header/atoms/MobileSheetBackHeader")
        )

AUTH_MAP = {
    "FormInput": "atoms", "LoadingButton": "atoms", "SecurityBadge": "atoms",
    "WarmupStatus": "atoms", "ThemeTogglerPlaceHolder": "atoms",
    "PasswordStrengthIndicator": "molecules", "BenefitsGrid": "molecules",
    "FeaturesGrid": "molecules", "LoginBanner": "molecules",
    "LoginForm": "organisms", "RegisterForm": "organisms",
}
for name, sub in AUTH_MAP.items():
    EXTRA_REPLACEMENTS.append((f"@/components/auth/{name}", f"@/components/auth/{sub}/{name}"))
    EXTRA_REPLACEMENTS.append((f"from \"./{name}\"", f"from \"@/components/auth/{sub}/{name}\""))
    EXTRA_REPLACEMENTS.append((f"from './{name}'", f"from '@/components/auth/{sub}/{name}'"))

STOREFRONT_CART_MAP = {
    "CartCheckbox": "atoms", "CartLoadingSkeleton": "atoms",
    "CartItem": "molecules",
    "CartSummary": "organisms", "CartEmptyState": "organisms", "CartRedirect": "organisms",
    "cartTotals": "utils",
}
for name, sub in STOREFRONT_CART_MAP.items():
    EXTRA_REPLACEMENTS.append((f"@/components/storefront/cart/{name}", f"@/components/storefront/cart/{sub}/{name}"))

STOREFRONT_CHECKOUT_MAP = {
    "FuturisticCheckoutLoader": "atoms", "CheckoutLoadingState": "atoms",
    "CheckoutSkeleton": "atoms", "AddressSkeleton": "atoms", "PaymentProcessing": "atoms",
    "CheckoutProgress": "molecules", "PaymentMethods": "molecules",
    "CheckoutSecurityCard": "molecules", "CheckoutSupportCard": "molecules",
    "CheckoutHeader": "molecules", "CheckoutOrderSummary": "molecules",
    "CheckoutLeftPanel": "organisms", "CheckoutRightPanel": "organisms",
    "CheckoutEmptyState": "organisms", "CheckoutSuccessRedirect": "organisms",
    "CheckoutComponent": "organisms", "PayPalProviderWrapper": "organisms",
    "checkoutUtils": "utils",
}
for name, sub in STOREFRONT_CHECKOUT_MAP.items():
    EXTRA_REPLACEMENTS.append((f"@/components/storefront/checkout/{name}", f"@/components/storefront/checkout/{sub}/{name}"))

STOREFRONT_WISHLIST_MAP = {
    "WishlistHeartButton": "atoms", "WishlistCtaButton": "atoms", "WishlistLoadingSkeleton": "atoms",
    "WishlistItemCard": "molecules", "WishlistSummary": "molecules",
    "WishlistEmptyState": "organisms",
    "wishlistSnapshot": "utils",
}
for name, sub in STOREFRONT_WISHLIST_MAP.items():
    EXTRA_REPLACEMENTS.append((f"@/components/storefront/wishlist/{name}", f"@/components/storefront/wishlist/{sub}/{name}"))

STOREFRONT_ORDERS_MAP = {
    "OrderStatusBadge": "atoms",
    "OrderTimeline": "molecules", "OrderEventTimeline": "molecules",
    "OrderHorizontalStepper": "molecules", "OrderStatusTabs": "molecules",
    "OrderList": "organisms", "AccountOrdersSidebar": "organisms", "OrderDetailsPanel": "organisms",
    "orderFilters": "utils",
}
for name, sub in STOREFRONT_ORDERS_MAP.items():
    EXTRA_REPLACEMENTS.append((f"@/components/storefront/orders/{name}", f"@/components/storefront/orders/{sub}/{name}"))

EXTRA_REPLACEMENTS.append(
    ("@/components/products/productPricing", "@/components/products/utils/productPricing")
)

# Relative imports within site-header
EXTRA_REPLACEMENTS.extend([
    ("from \"./config/", "from \"@/components/layout/site-header/config/"),
    ("from './config/", "from '@/components/layout/site-header/config/"),
    ("from \"./hooks/", "from \"@/components/layout/site-header/hooks/"),
    ("from './hooks/", "from '@/components/layout/site-header/hooks/"),
    ("from \"./HeaderBrandLogo\"", "from \"@/components/layout/site-header/atoms/HeaderBrandLogo\""),
    ("from \"./HeaderPromoTopBar\"", "from \"@/components/layout/site-header/molecules/HeaderPromoTopBar\""),
    ("from \"./HeaderDesktopSearchBar\"", "from \"@/components/layout/site-header/molecules/HeaderDesktopSearchBar\""),
    ("from \"./HeaderDesktopQuickActions\"", "from \"@/components/layout/site-header/molecules/HeaderDesktopQuickActions\""),
    ("from \"./HeaderAccountDropdown\"", "from \"@/components/layout/site-header/organisms/HeaderAccountDropdown\""),
    ("from \"./HeaderDesktopNavBar\"", "from \"@/components/layout/site-header/organisms/HeaderDesktopNavBar\""),
    ("from \"./mobile/HeaderMobileNavSheet\"", "from \"@/components/layout/site-header/organisms/mobile/HeaderMobileNavSheet\""),
    ("from './mobile/HeaderMobileNavSheet'", "from '@/components/layout/site-header/organisms/mobile/HeaderMobileNavSheet'"),
    ("from \"../site-header.types\"", "from \"@/components/layout/site-header/types/site-header.types\""),
    ("from '../site-header.types'", "from '@/components/layout/site-header/types/site-header.types'"),
    ("from \"./site-header.types\"", "from \"@/components/layout/site-header/types/site-header.types\""),
    ("from './site-header.types'", "from '@/components/layout/site-header/types/site-header.types'"),
    ("from \"./MobileSheetBackHeader\"", "from \"@/components/layout/site-header/atoms/MobileSheetBackHeader\""),
    ("from './MobileSheetBackHeader'", "from '@/components/layout/site-header/atoms/MobileSheetBackHeader'"),
    ("from \"../config/", "from \"@/components/layout/site-header/config/"),
    ("from '../config/", "from '@/components/layout/site-header/config/"),
])

# listing relative imports
EXTRA_REPLACEMENTS.extend([
    ("from \"./products-listing.utils\"", "from \"@/components/products/listing/utils/products-listing.utils\""),
    ("from './products-listing.utils'", "from '@/components/products/listing/utils/products-listing.utils'"),
    ("from \"./ProductsEmptyState\"", "from \"@/components/products/listing/molecules/ProductsEmptyState\""),
    ("from \"./ProductsFetchErrorState\"", "from \"@/components/products/listing/molecules/ProductsFetchErrorState\""),
    ("from \"./ProductsLoadMoreButton\"", "from \"@/components/products/listing/molecules/ProductsLoadMoreButton\""),
    ("from \"./ProductsResultsSummary\"", "from \"@/components/products/listing/molecules/ProductsResultsSummary\""),
    ("from './ProductsEmptyState'", "from '@/components/products/listing/molecules/ProductsEmptyState'"),
    ("from './ProductsFetchErrorState'", "from '@/components/products/listing/molecules/ProductsFetchErrorState'"),
    ("from './ProductsLoadMoreButton'", "from '@/components/products/listing/molecules/ProductsLoadMoreButton'"),
    ("from './ProductsResultsSummary'", "from '@/components/products/listing/molecules/ProductsResultsSummary'"),
    ("from \"../ProductGrid\"", "from \"@/components/products/organisms/ProductGrid\""),
    ("from \"../ProductPagination\"", "from \"@/components/products/molecules/ProductPagination\""),
    ("from '../ProductGrid'", "from '@/components/products/organisms/ProductGrid'"),
    ("from '../ProductPagination'", "from '@/components/products/molecules/ProductPagination'"),
    ("from \"../ProductFilters\"", "from \"@/components/products/molecules/ProductFilters\""),
    ("from '../ProductFilters'", "from '@/components/products/molecules/ProductFilters'"),
    ("from \"./ProducSkeleton\"", "from \"@/components/products/atoms/ProductTableSkeleton\""),
    ("ProducSkeleton", "ProductTableSkeleton"),
    ("from \"./theme/ThemeMenuRow\"", "from \"@/components/common/molecules/theme/ThemeMenuRow\""),
    ("from \"./theme/ThemeToggleDesktop\"", "from \"@/components/common/molecules/theme/ThemeToggleDesktop\""),
    ("from './theme/ThemeMenuRow'", "from '@/components/common/molecules/theme/ThemeMenuRow'"),
    ("from './theme/ThemeToggleDesktop'", "from '@/components/common/molecules/theme/ThemeToggleDesktop'"),
    ("from \"./ProductTableSkeleton\"", "from \"@/components/products/atoms/ProductTableSkeleton\""),
    ("from './ProductTableSkeleton'", "from '@/components/products/atoms/ProductTableSkeleton'"),
    ("from \"./CheckoutComponent\"", "from \"@/components/storefront/checkout/organisms/CheckoutComponent\""),
    ("from './CheckoutComponent'", "from '@/components/storefront/checkout/organisms/CheckoutComponent'"),
    ("from './CheckoutHeader'", "from '@/components/storefront/checkout/molecules/CheckoutHeader'"),
    ("from './CheckoutEmptyState'", "from '@/components/storefront/checkout/organisms/CheckoutEmptyState'"),
    ("from './CheckoutLeftPanel'", "from '@/components/storefront/checkout/organisms/CheckoutLeftPanel'"),
    ("from './CheckoutRightPanel'", "from '@/components/storefront/checkout/organisms/CheckoutRightPanel'"),
    ("from './CheckoutSecurityCard'", "from '@/components/storefront/checkout/molecules/CheckoutSecurityCard'"),
    ("from './CheckoutSupportCard'", "from '@/components/storefront/checkout/molecules/CheckoutSupportCard'"),
])

# site-header index
EXTRA_REPLACEMENTS.append(
    ("from \"./SiteHeader\"", "from \"@/components/layout/site-header/organisms/SiteHeader\"")
)


def move_files() -> None:
    for old, new in MOVES:
        src = COMPONENTS / old
        dst = COMPONENTS / new
        if not src.exists():
            print(f"SKIP missing: {old}")
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        src.rename(dst)
        print(f"MOVED {old} -> {new}")


def patch_file(path: Path) -> bool:
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, IsADirectoryError):
        return False
    original = text
    replacements = sorted(set(EXTRA_REPLACEMENTS), key=lambda x: len(x[0]), reverse=True)
    for old, new in replacements:
        text = text.replace(old, new)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def patch_all() -> int:
    count = 0
    for root, _, files in os.walk(ROOT):
        for f in files:
            if f.endswith((".ts", ".tsx", ".js", ".jsx")):
                p = Path(root) / f
                if patch_file(p):
                    count += 1
    return count


def cleanup_empty_dirs() -> None:
    for root, dirs, files in os.walk(COMPONENTS, topdown=False):
        if not files and not dirs:
            try:
                Path(root).rmdir()
            except OSError:
                pass


def write_barrel_files() -> None:
    barrels = {
        "common/index.ts": '''export { default as AppShell } from "./organisms/AppShell";
export { default as ThemeToggle } from "./organisms/theme/ThemeToggler";
''',
        "storefront/cart/index.ts": '''export { CartSummary } from "./organisms/CartSummary";
export { CartItem } from "./molecules/CartItem";
export { useCartSelection } from "./hooks/useCartSelection";
''',
        "products/listing/index.ts": '''export { ProductsHeroBanner } from "./organisms/ProductsHeroBanner";
export { ProductsListingMain } from "./organisms/ProductsListingMain";
export { useProductListingPage } from "./hooks/useProductListingPage";
''',
        "layout/site-header/index.ts": '''export { default, default as SiteHeader } from "./organisms/SiteHeader";
''',
    }
    for rel, content in barrels.items():
        path = COMPONENTS / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")


def main() -> None:
    move_files()
    cleanup_empty_dirs()
    n = patch_all()
    write_barrel_files()
    cleanup_empty_dirs()
    print(f"Patched {n} files")


if __name__ == "__main__":
    main()
