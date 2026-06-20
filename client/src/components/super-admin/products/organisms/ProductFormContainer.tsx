"use client";

import { FormProvider } from "react-hook-form";
import { ProductFormHeader } from "../molecules/ProductFormHeader";
import { ProductFormWorkflowSteps } from "../molecules/ProductFormWorkflowSteps";
import { ProductFormImageUploader } from "../molecules/ProductFormImageUploader";
import { ProductFormDetailsSection } from "./ProductFormDetailsSection";
import { ProductFormVariantsPricingSection } from "./ProductFormVariantsPricingSection";
import { ProductFormSeoSection } from "./ProductFormSeoSection";
import { ProductFormFooter } from "../molecules/ProjectFormFooter";
import { ProductFormLoadingOverlay } from "../atoms/ProductFormLoadingOverlay";
import { useProductForm } from "../hooks/useProductForm";
import { useProductFormCategory } from "../hooks/useProductFormCategory";
import { useProductFormEdit } from "../hooks/useProductFormEdit";
import { useProductFormSubmission } from "../hooks/useProductFormSubmission";
import { useProductCatalog } from "@/components/products/hooks/useProductCatalog";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { mergeImageFiles } from "../lib/product-form-utils";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

interface ProductFormContainerProps {
  listPath?: string;
}

export function ProductFormContainer({ 
  listPath = "/super-admin/products/list" 
}: ProductFormContainerProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [categoryAutoLocked, setCategoryAutoLocked] = useState(true);
  
  const { catalogDepartments, catalogLoading, catalogError } = useProductCatalog();
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
  const isEditMode = !!productId;

  const aiSeoEnabled = isFeatureEnabled("ai.seoGenerator");

  // Form methods
  const formMethods = useProductForm();
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    errors,
  } = formMethods;

  const nameValue = watch("name");
  const brandValue = watch("brand");
  const categoryValue = watch("category");
  const sizesValue = watch("sizes") ?? [];
  const colorsValue = watch("colors") ?? [];

  // Category management
  const categoryHook = useProductFormCategory({
    catalogDepartments,
    nameValue,
    selectedSubcategoryId,
    setValue,
  });

  // Edit mode management
  const editHook = useProductFormEdit({
    isEditMode,
    productId,
    catalogDepartments,
    reset,
    setSelectedSubcategoryId,
    setSelectedDepartmentId: (id) => {
      setSelectedDepartmentId(id);
      categoryHook.setSelectedDepartmentId(id);
    },
    setCategoryAutoLocked,
  });

  // Form submission
  const submissionHook = useProductFormSubmission({
    isEditMode,
    productId,
    selectedFiles,
    selectedSubcategoryId,
    selectedDepartment: categoryHook.selectedDepartment,
    selectedSubcategory: categoryHook.selectedSubcategory,
    listPath,
  });

  const onSubmit = handleSubmit(submissionHook.onSubmit);

  // Handlers
  const toggleSize = (size: string) => {
    const prev = sizesValue;
    const next = prev.includes(size)
      ? prev.filter((s) => s !== size)
      : [...prev, size];
    setValue("sizes", next, { shouldValidate: true, shouldDirty: true });
  };

  const toggleColor = (color: string) => {
    const prev = colorsValue;
    const next = prev.includes(color)
      ? prev.filter((c) => c !== color)
      : [...prev, color];
    setValue("colors", next, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <FormProvider {...formMethods}>
      <div className="min-h-screen bg-linear-to-b from-background to-card/30 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <ProductFormHeader
            isEditMode={isEditMode}
            onBackToList={() => {}}
          />

          <form onSubmit={onSubmit} className="relative space-y-8" noValidate>
            <ProductFormLoadingOverlay show={editHook.isEditHydrating} />

            <ProductFormWorkflowSteps showSeoStep={aiSeoEnabled} />

            <ProductFormImageUploader
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
                selectedDepartmentId={categoryHook.selectedDepartmentId}
                selectedSubcategoryId={selectedSubcategoryId}
                selectedDepartment={categoryHook.selectedDepartment}
                onDepartmentChange={(id) => {
                  setSelectedDepartmentId(id);
                  categoryHook.handleDepartmentChange(id);
                }}
                onSubcategoryChange={(id) => {
                  setSelectedSubcategoryId(id);
                  categoryHook.handleSubcategoryChange(id);
                }}
                onCategoryManualChange={categoryHook.handleCategoryManualChange}
                errors={errors}
                registerName={register("name")}
                registerDescription={register("description")}
                registerCategory={register("category")}
                control={control}
              />

              <ProductFormVariantsPricingSection
                selectedSizes={sizesValue}
                selectedColors={colorsValue}
                onToggleSize={toggleSize}
                onToggleColor={toggleColor}
                errors={errors}
                registerPrice={register("price")}
                registerStock={register("stock")}
              />
            </div>

            {aiSeoEnabled && (
              <ProductFormSeoSection
                errors={errors}
                registerSeoTitle={register("seoTitle")}
                registerMetaDescription={register("metaDescription")}
                registerSeoKeywords={register("seoKeywords")}
                productName={nameValue}
                brand={brandValue}
                category={categoryValue}
                onApplyGeneratedContent={(content) => {
                  setValue("description", content.productDescription, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  setValue("seoTitle", content.title, { shouldDirty: true });
                  setValue("metaDescription", content.metaDescription, { shouldDirty: true });
                  setValue("seoKeywords", content.keywords.join(", "), { shouldDirty: true });
                }}
              />
            )}

            <ProductFormFooter
              isSubmitting={submissionHook.isSubmitting}
              isEditMode={isEditMode}
              error={submissionHook.error}
              aiSeoEnabled={aiSeoEnabled}
            />
          </form>
        </div>
      </div>
    </FormProvider>
  );
}