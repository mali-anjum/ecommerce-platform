import type { ReactNode } from "react";

export type MobileSheetView = "menu" | "account" | "categories";

export type HeaderNavItem = {
  title: string;
  to: string;
  icon: ReactNode;
  badge?: string;
  megaMenu?: boolean;
};

export type AccountMenuVisual = {
  icon: ReactNode;
  helper: string;
};

export type InfoMenuLink = {
  title: string;
  to: string;
  icon: ReactNode;
};

export type DepartmentOptionGroup = {
  categoryTitle: string;
  subcategories: { label: string; value: string }[];
};
