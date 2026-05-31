#!/usr/bin/env python3
"""Colocate src/store and src/types into feature modules under state/ and types/."""

from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
COMPONENTS = ROOT / "components"
LIB = ROOT / "lib"

MOVES: list[tuple[str, str]] = [
    # --- state (Zustand) ---
    ("store/useAuthStore.ts", "components/auth/state/useAuthStore.ts"),
    ("store/useThemeStore.ts", "components/common/state/useThemeStore.ts"),
    ("store/useProductStore.ts", "components/products/state/useProductStore.ts"),
    ("store/useCategoryStore.ts", "components/products/state/useCategoryStore.ts"),
    ("store/useCartStore.ts", "components/storefront/cart/state/useCartStore.ts"),
    ("store/useCartSelectionStore.ts", "components/storefront/cart/state/useCartSelectionStore.ts"),
    ("store/useWishlistStore.ts", "components/storefront/wishlist/state/useWishlistStore.ts"),
    ("store/useOrderStore.ts", "components/storefront/orders/state/useOrderStore.ts"),
    ("store/useAddressStore.ts", "components/storefront/checkout/state/useAddressStore.ts"),
    ("store/useCouponStore.ts", "components/storefront/checkout/state/useCouponStore.ts"),
    ("store/useAdminUsersStore.ts", "components/super-admin/users/state/useAdminUsersStore.ts"),
    ("store/useAnalyticsStore.ts", "components/super-admin/analytics/state/useAnalyticsStore.ts"),
    ("store/useSettingsStore.ts", "components/super-admin/state/useSettingsStore.ts"),
    ("store/__tests__/useAnalyticsStore.test.ts", "components/super-admin/analytics/state/__tests__/useAnalyticsStore.test.ts"),
    # --- types ---
    ("types/auth/User.ts", "components/auth/types/User.ts"),
    ("types/auth/Session.ts", "components/auth/types/Session.ts"),
    ("types/auth/TokenExpiryInfoFromBackend.ts", "components/auth/types/TokenExpiryInfoFromBackend.ts"),
    ("types/product.ts", "components/products/types/product.ts"),
    ("types/category.ts", "components/products/types/category.ts"),
    ("types/cart/cartItemStore.ts", "components/storefront/cart/types/cartItemStore.ts"),
    ("types/cart/CartItemProps.ts", "components/storefront/cart/types/CartItemProps.ts"),
    ("types/cart/CartSummaryProps.ts", "components/storefront/cart/types/CartSummaryProps.ts"),
    ("types/checkout/Coupon.ts", "components/storefront/checkout/types/Coupon.ts"),
    ("types/checkout/index.ts", "components/storefront/checkout/types/index.ts"),
    ("types/checkout/PaymentFlowProps.ts", "components/storefront/checkout/types/PaymentFlowProps.ts"),
    ("types/wishlist/wishlistTypes.ts", "components/storefront/wishlist/types/wishlistTypes.ts"),
    ("types/order/orderTypes.ts", "components/storefront/orders/types/orderTypes.ts"),
    ("types/order/orderTracking.ts", "components/storefront/orders/types/orderTracking.ts"),
    ("types/order/OrderSummaryProps.tsx", "components/storefront/orders/types/OrderSummaryProps.tsx"),
    ("types/address/Address.ts", "components/storefront/checkout/types/Address.ts"),
    ("types/admin/userAdminTypes.ts", "components/super-admin/users/types/userAdminTypes.ts"),
    ("types/analytics/analyticsStoreTypes.ts", "components/super-admin/analytics/types/analyticsStoreTypes.ts"),
    ("types/analytics.ts", "components/super-admin/analytics/types/analytics.ts"),
    ("types/coupon/coupon.types.ts", "components/super-admin/coupon/types/coupon.types.ts"),
    ("types/formatCurrency.ts", "lib/formatCurrency.ts"),
]

STORE_IMPORTS = [
    ("@/store/useAuthStore", "@/components/auth/state/useAuthStore"),
    ("@/store/useThemeStore", "@/components/common/state/useThemeStore"),
    ("@/store/useProductStore", "@/components/products/state/useProductStore"),
    ("@/store/useCategoryStore", "@/components/products/state/useCategoryStore"),
    ("@/store/useCartStore", "@/components/storefront/cart/state/useCartStore"),
    ("@/store/useCartSelectionStore", "@/components/storefront/cart/state/useCartSelectionStore"),
    ("@/store/useWishlistStore", "@/components/storefront/wishlist/state/useWishlistStore"),
    ("@/store/useOrderStore", "@/components/storefront/orders/state/useOrderStore"),
    ("@/store/useAddressStore", "@/components/storefront/checkout/state/useAddressStore"),
    ("@/store/useCouponStore", "@/components/storefront/checkout/state/useCouponStore"),
    ("@/store/useAdminUsersStore", "@/components/super-admin/users/state/useAdminUsersStore"),
    ("@/store/useAnalyticsStore", "@/components/super-admin/analytics/state/useAnalyticsStore"),
    ("@/store/useSettingsStore", "@/components/super-admin/state/useSettingsStore"),
]

TYPE_IMPORTS = [
    ("@/types/auth/User", "@/components/auth/types/User"),
    ("@/types/auth/Session", "@/components/auth/types/Session"),
    ("@/types/auth/TokenExpiryInfoFromBackend", "@/components/auth/types/TokenExpiryInfoFromBackend"),
    ("@/types/product", "@/components/products/types/product"),
    ("@/types/category", "@/components/products/types/category"),
    ("@/types/cart/cartItemStore", "@/components/storefront/cart/types/cartItemStore"),
    ("@/types/cart/CartItemProps", "@/components/storefront/cart/types/CartItemProps"),
    ("@/types/cart/CartSummaryProps", "@/components/storefront/cart/types/CartSummaryProps"),
    ("@/types/checkout/Coupon", "@/components/storefront/checkout/types/Coupon"),
    ("@/types/checkout/PaymentFlowProps", "@/components/storefront/checkout/types/PaymentFlowProps"),
    ("@/types/checkout/index", "@/components/storefront/checkout/types/index"),
    ("@/types/wishlist/wishlistTypes", "@/components/storefront/wishlist/types/wishlistTypes"),
    ("@/types/order/orderTypes", "@/components/storefront/orders/types/orderTypes"),
    ("@/types/order/orderTracking", "@/components/storefront/orders/types/orderTracking"),
    ("@/types/order/OrderSummaryProps", "@/components/storefront/orders/types/OrderSummaryProps"),
    ("@/types/address/Address", "@/components/storefront/checkout/types/Address"),
    ("@/types/admin/userAdminTypes", "@/components/super-admin/users/types/userAdminTypes"),
    ("@/types/analytics/analyticsStoreTypes", "@/components/super-admin/analytics/types/analyticsStoreTypes"),
    ("@/types/analytics", "@/components/super-admin/analytics/types/analytics"),
    ("@/types/coupon/coupon.types", "@/components/super-admin/coupon/types/coupon.types"),
    ("@/types/formatCurrency", "@/lib/formatCurrency"),
    ("@/types/checkout", "@/components/storefront/checkout/types"),
    ("../../types/order/orderFilters", "../../components/storefront/orders/utils/orderFilters"),
    ("../../components/orders/orderFilters", "../../components/storefront/orders/utils/orderFilters"),
    ("../../types/cart/cartTotals", "../../components/storefront/cart/utils/cartTotals"),
    ("../../components/products/productPricing", "../../components/products/utils/productPricing"),
]

REPLACEMENTS = sorted(set(STORE_IMPORTS + TYPE_IMPORTS), key=lambda x: len(x[0]), reverse=True)


def move_files() -> None:
    for old, new in MOVES:
        src = ROOT / old
        dst = ROOT / new
        if not src.exists():
            print(f"SKIP missing: {old}")
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        src.rename(dst)
        print(f"MOVED {old} -> {new}")


def patch_all() -> int:
    count = 0
    for root, _, files in os.walk(ROOT):
        for f in files:
            if not f.endswith((".ts", ".tsx", ".js", ".jsx")):
                continue
            path = Path(root) / f
            try:
                text = path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, IsADirectoryError):
                continue
            original = text
            for old, new in REPLACEMENTS:
                text = text.replace(old, new)
            if text != original:
                path.write_text(text, encoding="utf-8")
                count += 1
    return count


def cleanup_empty() -> None:
    for folder in [ROOT / "store", ROOT / "types"]:
        if not folder.exists():
            continue
        for root, dirs, files in os.walk(folder, topdown=False):
            for f in files:
                pass
            if not files and not dirs:
                try:
                    Path(root).rmdir()
                except OSError:
                    pass
        try:
            remaining = list(folder.rglob("*"))
            if not remaining or all(p.is_dir() for p in remaining):
                import shutil
                shutil.rmtree(folder, ignore_errors=True)
        except Exception:
            pass


def write_barrels() -> None:
    barrels = {
        "components/auth/state/index.ts": 'export { useAuthStore } from "./useAuthStore";\n',
        "components/common/state/index.ts": 'export { useThemeStore } from "./useThemeStore";\n',
        "components/products/state/index.ts": '''export { useProductStore } from "./useProductStore";
export { useCategoryStore } from "./useCategoryStore";
''',
        "components/storefront/cart/state/index.ts": '''export { useCartStore } from "./useCartStore";
export { useCartSelectionStore } from "./useCartSelectionStore";
''',
        "components/storefront/wishlist/state/index.ts": 'export { useWishlistStore } from "./useWishlistStore";\n',
        "components/storefront/orders/state/index.ts": 'export { useOrderStore } from "./useOrderStore";\n',
        "components/storefront/checkout/state/index.ts": '''export { useAddressStore } from "./useAddressStore";
export { useCouponStore } from "./useCouponStore";
''',
        "components/super-admin/state/index.ts": 'export { useSettingsStore } from "./useSettingsStore";\n',
        "components/super-admin/users/state/index.ts": 'export { useAdminUsersStore } from "./useAdminUsersStore";\n',
        "components/super-admin/analytics/state/index.ts": 'export { useAnalyticsStore } from "./useAnalyticsStore";\n',
    }
    for rel, content in barrels.items():
        path = ROOT / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")


def main() -> None:
    move_files()
    n = patch_all()
    write_barrels()
    cleanup_empty()
    print(f"Patched {n} files")


if __name__ == "__main__":
    main()
