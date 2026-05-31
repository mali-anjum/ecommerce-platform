"use client";

import { useCategoryStore } from "@/components/products/state/useCategoryStore";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { DepartmentOptionGroup } from "@/components/layout/site-header/types/site-header.types";

export function useSiteHeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { categories, fetchCategories } = useCategoryStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  const departmentOptions: DepartmentOptionGroup[] = useMemo(
    () =>
      categories.map((category) => ({
        categoryTitle: category.title,
        subcategories: category.subcategories.map((sub) => ({
          label: sub.title,
          value: `${category.title}::${sub.title}`,
        })),
      })),
    [categories],
  );

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (pathname !== "/products") return;
    const main = searchParams.get("mainCategory")?.trim() ?? "";
    const sub = searchParams.get("subcategory")?.trim() ?? "";
    setSelectedDepartment(!main ? "all" : sub ? `${main}::${sub}` : "all");
    setSearchQuery(searchParams.get("search") ?? "");
  }, [pathname, searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());

    if (selectedDepartment !== "all") {
      const [mainCategory, subcategory] = selectedDepartment.split("::");
      if (mainCategory) params.set("mainCategory", mainCategory);
      if (subcategory) params.set("subcategory", subcategory);
    }

    const query = params.toString();
    router.push(query ? `/products?${query}` : "/products");
  };

  const handleDepartmentSelect = (value: string) => {
    setSelectedDepartment(value);
    if (pathname !== "/products") return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("mainCategory");
    params.delete("subcategory");

    if (value !== "all") {
      const [mainCategory, subcategory] = value.split("::");
      if (mainCategory) params.set("mainCategory", mainCategory);
      if (subcategory) params.set("subcategory", subcategory);
    }

    const next = params.toString();
    router.replace(next ? `/products?${next}` : "/products");
  };

  return {
    categories,
    searchQuery,
    setSearchQuery,
    selectedDepartment,
    departmentOptions,
    handleSearch,
    handleDepartmentSelect,
  };
}
