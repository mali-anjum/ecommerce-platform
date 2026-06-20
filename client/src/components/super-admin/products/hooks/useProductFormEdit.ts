"use client";

import { useEffect, useState, useRef } from "react";
import { useProductStore } from "@/components/products/state/useProductStore";

interface UseProductFormEditProps {
  isEditMode: boolean;
  productId: string | null;
  catalogDepartments: any[];
  reset: (values: any) => void;
  setSelectedSubcategoryId: (id: string) => void;
  setSelectedDepartmentId: (id: string) => void;
  setCategoryAutoLocked: (locked: boolean) => void;
}

export function useProductFormEdit({
  isEditMode,
  productId,
  catalogDepartments,
  reset,
  setSelectedSubcategoryId,
  setSelectedDepartmentId,
  setCategoryAutoLocked,
}: UseProductFormEditProps) {
  const [isEditHydrating, setIsEditHydrating] = useState(false);
  const wasEditModeRef = useRef(false);
  const { getProductById } = useProductStore();

  // Load product data for edit mode
  useEffect(() => {
    if (!isEditMode || !productId) return;

    let cancelled = false;
    setIsEditHydrating(true);

    getProductById(productId)
      .then((product) => {
        if (cancelled || !product) return;

        reset({
          name: product.name,
          brand: product.brand,
          description: product.description ?? "",
          seoTitle: product.seoTitle ?? "",
          metaDescription: product.metaDescription ?? "",
          seoKeywords: Array.isArray(product.seoKeywords)
            ? product.seoKeywords.join(", ")
            : "",
          category: product.category,
          gender: product.gender ?? "",
          price: product.price.toString(),
          stock: String(product.stock ?? 0),
          sizes: product.sizes ?? [],
          colors: product.colors ?? [],
        });

        if (product.subcategoryId) {
          setSelectedSubcategoryId(product.subcategoryId);
          for (const dept of catalogDepartments) {
            if (
              dept.subcategories.some((sub: any) => sub.id === product.subcategoryId)
            ) {
              setSelectedDepartmentId(dept.id);
              break;
            }
          }
          setCategoryAutoLocked(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsEditHydrating(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    isEditMode,
    productId,
    getProductById,
    catalogDepartments,
    reset,
    setSelectedSubcategoryId,
    setSelectedDepartmentId,
    setCategoryAutoLocked,
  ]);

  // Reset form when switching from edit to create
  useEffect(() => {
    if (isEditMode) {
      wasEditModeRef.current = true;
      return;
    }

    if (!wasEditModeRef.current) return;

    wasEditModeRef.current = false;
    // Reset form logic here
  }, [isEditMode, reset]);

  // Align department with subcategory after catalog loads
  useEffect(() => {
    // This is handled in the main component via the catalog loading effect
  }, [catalogDepartments]);

  return {
    isEditHydrating,
    wasEditModeRef: wasEditModeRef.current,
  };
}