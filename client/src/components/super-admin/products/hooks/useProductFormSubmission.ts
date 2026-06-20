"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useToast } from "@/components/ui/hooks/use-toast";
import { useProductStore } from "@/components/products/state/useProductStore";
import { protectProductFormAction } from "@/actions/product";
import { sentryTracker } from "@/lib/monitoring";
import { ProductFormValues } from "@/components/schemas/productFormSchema";

interface UseProductFormSubmissionProps {
  isEditMode: boolean;
  productId: string | null;
  selectedFiles: File[];
  selectedSubcategoryId: string;
  selectedDepartment: any;
  selectedSubcategory: any;
  listPath: string;
  onSuccess?: () => void;
}

export function useProductFormSubmission({
  isEditMode,
  productId,
  selectedFiles,
  selectedSubcategoryId,
  selectedDepartment,
  selectedSubcategory,
  listPath,
  onSuccess,
}: UseProductFormSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { createProduct, updateProduct } = useProductStore();

  const buildFormData = (values: ProductFormValues): FormData => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("brand", values.brand);
    formData.append("description", values.description);
    if (values.seoTitle?.trim()) {
      formData.append("seoTitle", values.seoTitle.trim());
    }
    if (values.metaDescription?.trim()) {
      formData.append("metaDescription", values.metaDescription.trim());
    }
    if (values.seoKeywords?.trim()) {
      formData.append("seoKeywords", values.seoKeywords.trim());
    }
    formData.append("category", values.category);
    formData.append("gender", values.gender);
    formData.append("price", values.price);
    formData.append("stock", values.stock);
    formData.append("sizes", values.sizes.join(","));
    formData.append("colors", values.colors.join(","));

    if (selectedSubcategoryId) {
      formData.append("subcategoryId", selectedSubcategoryId);
      if (selectedDepartment?.slug) {
        formData.append("departmentSlug", selectedDepartment.slug);
      }
      if (selectedSubcategory?.slug) {
        formData.append("subcategorySlug", selectedSubcategory.slug);
      }
    }

    if (!isEditMode) {
      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });
    }

    return formData;
  };

  const onSubmit = async (values: ProductFormValues) => {
    setError(null);

    // Validate images for new product
    if (!isEditMode && selectedFiles.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please upload at least one product image.",
        variant: "destructive",
      });
      return;
    }

    // Server-side validation
    const checkFirstLevelFormSanitization = await protectProductFormAction();
    if (!checkFirstLevelFormSanitization.success) {
      toast({
        title: "Validation Error",
        description: checkFirstLevelFormSanitization.error,
        variant: "destructive",
      });
      return;
    }

    const formData = buildFormData(values);

    setIsSubmitting(true);
    try {
      const result = isEditMode
        ? await updateProduct(productId!, formData)
        : await createProduct(formData);

      if (result) {
        toast({
          title: "Success!",
          description: isEditMode
            ? "Product updated successfully"
            : "Product created successfully",
          className: "bg-success/10 border-success/20 text-success",
        });
        router.push(listPath);
        onSuccess?.();
      }
    } catch (submitErr) {
      sentryTracker(submitErr, { source: "ProductForm" });
      const message = axios.isAxiosError(submitErr)
        ? submitErr.response?.data?.message ||
          submitErr.response?.data?.error ||
          submitErr.message
        : "Something went wrong while saving the product.";
      setError(message);
      toast({
        title: "Could not save product",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    error,
    onSubmit,
    buildFormData,
  };
}