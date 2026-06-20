"use client";

import { useState, useEffect, useMemo } from "react";
import { inferSubcategoryFromTitle } from "@/components/products/utils/inferSubcategoryFromTitle";
import { UseFormSetValue } from "react-hook-form"; 
import { ProductFormValues } from "@/components/schemas/productFormSchema";

interface UseProductFormCategoryProps {
  catalogDepartments: any[];
  nameValue: string;
  selectedSubcategoryId: string;
  setValue: UseFormSetValue<ProductFormValues>
}

export function useProductFormCategory({
  catalogDepartments,
  nameValue,
  selectedSubcategoryId,
  setValue,
}: UseProductFormCategoryProps) {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [categoryAutoLocked, setCategoryAutoLocked] = useState(true);

  const selectedDepartment = useMemo(
    () => catalogDepartments.find((item) => item.id === selectedDepartmentId),
    [catalogDepartments, selectedDepartmentId]
  );

  const selectedSubcategory = useMemo(
    () =>
      selectedDepartment?.subcategories.find(
        (item: any) => item.id === selectedSubcategoryId
      ) ?? null,
    [selectedDepartment, selectedSubcategoryId]
  );

  // Auto-infer category from product name
  useEffect(() => {
    if (!categoryAutoLocked || selectedSubcategoryId) return;
    const guess = inferSubcategoryFromTitle(nameValue, catalogDepartments);
    if (guess) {
      setSelectedDepartmentId(guess.departmentId);
      setValue("category", guess.subcategoryId, { shouldValidate: true });
    }
  }, [nameValue, categoryAutoLocked, selectedSubcategoryId, catalogDepartments, setValue]);

  // Set category when subcategory changes
  useEffect(() => {
    if (!selectedSubcategory) return;
    setValue("category", selectedSubcategory.title, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [selectedSubcategory, setValue]);

  const handleDepartmentChange = (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setValue("category", "", { shouldValidate: true });
  };

  const handleSubcategoryChange = (_subcategoryId: string) => {
    setValue("category", "", { shouldValidate: true });
    setCategoryAutoLocked(true);
  };

  const handleCategoryManualChange = () => {
    setCategoryAutoLocked(false);
  };

  return {
    selectedDepartmentId,
    selectedSubcategoryId,
    selectedDepartment,
    selectedSubcategory,
    categoryAutoLocked,
    setSelectedDepartmentId,
    // setSelectedSubcategoryId,
    handleDepartmentChange,
    handleSubcategoryChange,
    handleCategoryManualChange,
  };
}