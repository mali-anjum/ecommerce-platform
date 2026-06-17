"use client";

import { protectProductFormAction } from "@/actions/product";
import { ProductFormFileUpload } from "@/components/super-admin/product-form/atoms/ProductFormFileUpload";
import { ProductFormHeader } from "@/components/super-admin/product-form/molecules/ProductFormHeader";
import { ProductFormLoadingOverlay } from "@/components/super-admin/product-form/atoms/ProductFormLoadingOverlay";
import { ProductFormDetailsSection } from "@/components/super-admin/product-form/organisms/ProductFormDetailsSection";
import { ProductFormVariantsPricingSection } from "@/components/super-admin/product-form/organisms/ProductFormVariantsPricingSection";
import { ProductFormSeoSection } from "@/components/super-admin/product-form/organisms/ProductFormSeoSection";
import { ProductFormWorkflowSteps } from "@/components/super-admin/product-form/molecules/ProductFormWorkflowSteps";
import {
  type ProductFormValues,
  emptyProductFormValues,
  productFormSchema,
} from "@/components/schemas/productFormSchema";
import {
  Button,
} from "@/components/ui/button";
import { useToast } from "@/components/ui/hooks/use-toast";
import { isFeatureEnabled } from "@/lib/feature-flags";
import type { SeoContentResult } from "@/lib/seo-generator/types";
import { useProductCatalog } from "@/components/products/hooks/useProductCatalog";
import {
  inferSubcategoryFromTitle,
} from "@/components/products/utils/inferSubcategoryFromTitle";
import { useProductStore } from "@/components/products/state/useProductStore";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { sentryTracker } from "@/lib/monitoring";

function mergeImageFiles(prev: File[], incoming: File[]): File[] {
  const seen = new Set(
    prev.map((f) => `${f.name}\0${f.size}\0${f.lastModified}`)
  );
  const out = [...prev];
  for (const f of incoming) {
    const key = `${f.name}\0${f.size}\0${f.lastModified}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(f);
    }
  }
  return out;
}

type ProductFormProps = {
  /** Where "Back to list" / success redirect goes (seller vs super-admin) */
  listPath?: string;
};

function ProductForm({
  listPath = "/super-admin/products/list",
}: ProductFormProps = {}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [categoryAutoLocked, setCategoryAutoLocked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditHydrating, setIsEditHydrating] = useState(false);
  const wasEditModeRef = useRef(false);

  const { toast } = useToast();
  const searchParams = useSearchParams();
  const getCurrentEditedProductId = searchParams.get("id");
  const isEditMode = !!getCurrentEditedProductId;

  const router = useRouter();
  const { createProduct, updateProduct, getProductById, error } =
    useProductStore();
  const { catalogDepartments, catalogLoading, catalogError } =
    useProductCatalog();

  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: emptyProductFormValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = methods;

  const selectedDepartment = useMemo(
    () => catalogDepartments.find((item) => item.id === selectedDepartmentId),
    [catalogDepartments, selectedDepartmentId]
  );

  const selectedSubcategory = useMemo(
    () =>
      selectedDepartment?.subcategories.find(
        (item) => item.id === selectedSubcategoryId
      ) ?? null,
    [selectedDepartment, selectedSubcategoryId]
  );

  useEffect(() => {
    if (!selectedSubcategory) return;
    setValue("category", selectedSubcategory.title, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [selectedSubcategory, setValue]);

  const nameValue = watch("name");
  useEffect(() => {
    if (!categoryAutoLocked || selectedSubcategoryId) return;
    const guess = inferSubcategoryFromTitle(nameValue, catalogDepartments);
    if (guess) {
      setSelectedDepartmentId(guess.departmentId);
      setSelectedSubcategoryId(guess.subcategoryId);
    }
  }, [
    nameValue,
    categoryAutoLocked,
    selectedSubcategoryId,
    catalogDepartments,
  ]);

  useEffect(() => {
    if (!isEditMode || !getCurrentEditedProductId) return;

    let cancelled = false;
    setIsEditHydrating(true);

    getProductById(getCurrentEditedProductId)
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
              dept.subcategories.some((sub) => sub.id === product.subcategoryId)
            ) {
              setSelectedDepartmentId(dept.id);
              break;
            }
          }
          setCategoryAutoLocked(true);
        } else {
          const guess = inferSubcategoryFromTitle(
            product.name,
            catalogDepartments
          );
          if (guess) {
            setSelectedDepartmentId(guess.departmentId);
            setSelectedSubcategoryId(guess.subcategoryId);
            setCategoryAutoLocked(true);
          }
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
    getCurrentEditedProductId,
    getProductById,
    catalogDepartments,
    reset,
  ]);

  useEffect(() => {
    if (isEditMode) {
      wasEditModeRef.current = true;
      return;
    }

    if (!wasEditModeRef.current) return;

    wasEditModeRef.current = false;
    reset(emptyProductFormValues);
    setSelectedFiles([]);
    setSelectedDepartmentId("");
    setSelectedSubcategoryId("");
    setCategoryAutoLocked(true);
  }, [isEditMode, reset]);

  // When catalog loads after the product, align department with subcategory selection.
  useEffect(() => {
    if (!selectedSubcategoryId || catalogDepartments.length === 0) return;
    const containing = catalogDepartments.find((d) =>
      d.subcategories.some((s) => s.id === selectedSubcategoryId)
    );
    if (containing && containing.id !== selectedDepartmentId) {
      setSelectedDepartmentId(containing.id);
    }
  }, [catalogDepartments, selectedSubcategoryId, selectedDepartmentId]);

  const sizesValue = watch("sizes");
  const colorsValue = watch("colors");
  const brandValue = watch("brand");
  const categoryValue = watch("category");
  const aiSeoEnabled = isFeatureEnabled("ai.seoGenerator");

  const handleApplyGeneratedContent = useCallback(
    (content: SeoContentResult) => {
      setValue("description", content.productDescription, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("seoTitle", content.title, { shouldDirty: true });
      setValue("metaDescription", content.metaDescription, { shouldDirty: true });
      setValue("seoKeywords", content.keywords.join(", "), { shouldDirty: true });
    },
    [setValue],
  );

  const toggleSize = (size: string) => {
    const prev = sizesValue ?? [];
    const next = prev.includes(size)
      ? prev.filter((s) => s !== size)
      : [...prev, size];
    setValue("sizes", next, { shouldValidate: true, shouldDirty: true });
  };

  const toggleColor = (color: string) => {
    const prev = colorsValue ?? [];
    const next = prev.includes(color)
      ? prev.filter((c) => c !== color)
      : [...prev, color];
    setValue("colors", next, { shouldValidate: true, shouldDirty: true });
  };

  const handleDepartmentChange = (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setSelectedSubcategoryId("");
    setValue("category", "", { shouldValidate: true });
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    setSelectedSubcategoryId(subcategoryId);
    setCategoryAutoLocked(true);
  };

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
    if (!isEditMode && selectedFiles.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please upload at least one product image.",
        variant: "destructive",
      });
      return;
    }

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
        ? await updateProduct(getCurrentEditedProductId!, formData)
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
      }
    } catch (submitErr) {
    sentryTracker(submitErr, { source: "ProductForm" });
      const message = axios.isAxiosError(submitErr)
        ? submitErr.response?.data?.message ||
          submitErr.response?.data?.error ||
          submitErr.message
        : "Something went wrong while saving the product.";
      toast({
        title: "Could not save product",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryRegister = register("category");

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-linear-to-b from-background to-card/30 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <ProductFormHeader
            isEditMode={isEditMode}
            onBackToList={() => router.push(listPath)}
          />

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="relative space-y-8"
            noValidate
          >
            <ProductFormLoadingOverlay show={isEditHydrating} />

            <ProductFormWorkflowSteps showSeoStep />

            <ProductFormFileUpload
              selectedFiles={selectedFiles}
              onFilesAdded={(incoming) =>
                setSelectedFiles((prev) => mergeImageFiles(prev, incoming))
              }
              onRemoveFile={(index) =>
                setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
              }
              isEditMode={isEditMode}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ProductFormDetailsSection
                catalogDepartments={catalogDepartments}
                catalogLoading={catalogLoading}
                catalogError={catalogError}
                selectedDepartmentId={selectedDepartmentId}
                selectedSubcategoryId={selectedSubcategoryId}
                selectedDepartment={selectedDepartment}
                onDepartmentChange={handleDepartmentChange}
                onSubcategoryChange={handleSubcategoryChange}
                onCategoryManualChange={() => setCategoryAutoLocked(false)}
                errors={errors}
                registerName={register("name")}
                registerDescription={register("description")}
                registerCategory={categoryRegister}
                control={control}
              />

              <ProductFormVariantsPricingSection
                selectedSizes={sizesValue ?? []}
                selectedColors={colorsValue ?? []}
                onToggleSize={toggleSize}
                onToggleColor={toggleColor}
                errors={errors}
                registerPrice={register("price")}
                registerStock={register("stock")}
              />
            </div>

            <ProductFormSeoSection
              errors={errors}
              registerSeoTitle={register("seoTitle")}
              registerMetaDescription={register("metaDescription")}
              registerSeoKeywords={register("seoKeywords")}
              productName={nameValue}
              brand={brandValue}
              category={categoryValue}
              onApplyGeneratedContent={handleApplyGeneratedContent}
            />

            <div className="rounded-xl border border-border/60 bg-card/50 p-5 space-y-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-6 text-lg font-semibold rounded-xl"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    {isEditMode ? "Updating product…" : "Creating product…"}
                  </span>
                ) : (
                  isEditMode ? "Save changes" : "Create product"
                )}
              </Button>

              {error ? (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              ) : null}

              <p className="text-xs text-center text-muted-foreground">
                {aiSeoEnabled
                  ? "Review all three steps above, then save once."
                  : "Review product details and pricing, then save."}
              </p>
            </div>
          </form>
        </div>
      </div>
    </FormProvider>
  );
}

export default ProductForm;
