#!/usr/bin/env python3
"""Colocate feature utils; keep app infrastructure in lib/."""

from __future__ import annotations

import os
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"

MOVES: list[tuple[str, str]] = [
    # Shared UI helpers → common
    ("lib/theme/types.ts", "components/common/utils/theme/types.ts"),
    ("lib/theme/theme-utils.ts", "components/common/utils/theme/theme-utils.ts"),
    ("lib/formatCurrency.ts", "components/common/utils/formatCurrency.ts"),
    # Product domain
    ("lib/catalog/inferSubcategoryFromTitle.ts", "components/products/utils/inferSubcategoryFromTitle.ts"),
    ("lib/catalog/__tests__/inferSubcategoryFromTitle.test.ts", "components/products/utils/__tests__/inferSubcategoryFromTitle.test.ts"),
    ("utils/config.ts", "components/products/config/catalogDefaults.ts"),
    # Super-admin coupon
    ("utils/coupon/couponGenerator.tsx", "components/super-admin/coupon/utils/couponGenerator.ts"),
    ("utils/coupon/couponHelpers.tsx", "components/super-admin/coupon/utils/couponHelpers.ts"),
    ("utils/coupon/dateHelpers.tsx", "components/super-admin/coupon/utils/dateHelpers.ts"),
    # Storefront cart
    ("utils/getCartItemArray.ts", "components/storefront/cart/utils/getCartItemArray.ts"),
    # Auth
    ("utils/getSafeISOString.ts", "components/auth/utils/getSafeISOString.ts"),
    # Products listing
    ("utils/errHandler.ts", "components/products/listing/utils/handleApiError.ts"),
    # Infrastructure: utils → lib
    ("utils/routes/api.ts", "lib/routes/api.ts"),
    ("utils/Logger.ts", "lib/logger.ts"),
    # Tests colocated with modules
    ("utils/__tests__/cartTotals.test.ts", "components/storefront/cart/utils/__tests__/cartTotals.test.ts"),
    ("utils/__tests__/orderFilters.test.ts", "components/storefront/orders/utils/__tests__/orderFilters.test.ts"),
    ("utils/__tests__/productPricing.test.ts", "components/products/utils/__tests__/productPricing.test.ts"),
]

REPLACEMENTS = sorted(
    [
        ("@/lib/theme/types", "@/components/common/utils/theme/types"),
        ("@/lib/theme/theme-utils", "@/components/common/utils/theme/theme-utils"),
        ("@/lib/formatCurrency", "@/components/common/utils/formatCurrency"),
        ("@/lib/catalog/inferSubcategoryFromTitle", "@/components/products/utils/inferSubcategoryFromTitle"),
        ("@/utils/routes/api", "@/lib/routes/api"),
        ("@/utils/Logger", "@/lib/logger"),
        ("@/utils/config", "@/components/products/config/catalogDefaults"),
        ("@/utils/coupon/couponGenerator", "@/components/super-admin/coupon/utils/couponGenerator"),
        ("@/utils/coupon/couponHelpers", "@/components/super-admin/coupon/utils/couponHelpers"),
        ("@/utils/coupon/dateHelpers", "@/components/super-admin/coupon/utils/dateHelpers"),
        ("@/utils/getCartItemArray", "@/components/storefront/cart/utils/getCartItemArray"),
        ("@/utils/errHandler", "@/components/products/listing/utils/handleApiError"),
        ("@/utils/getSafeISOString", "@/components/auth/utils/getSafeISOString"),
        ('from "./Logger"', 'from "@/lib/logger"'),
    ],
    key=lambda x: len(x[0]),
    reverse=True,
)


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
    for folder in [ROOT / "utils", ROOT / "lib" / "catalog", ROOT / "lib" / "theme"]:
        if folder.exists():
            shutil.rmtree(folder, ignore_errors=True)


def main() -> None:
    move_files()
    n = patch_all()
    cleanup_empty()
    print(f"Patched {n} files")


if __name__ == "__main__":
    main()
