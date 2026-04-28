"use client";

import { protectProductFormAction } from "@/actions/product";
import { ProductFormCatalogAlerts } from "@/components/super-admin/product-form/ProductFormCatalogAlerts";
import { ProductFormField } from "@/components/super-admin/product-form/ProductFormField";
import { ProductFormFileUpload } from "@/components/super-admin/product-form/ProductFormFileUpload";
import {
  ProductFormColorPicker,
  ProductFormSizePicker,
} from "@/components/super-admin/product-form/ProductFormVariantPickers";
import {
  emptyProductFormValues,
  productFormSchema,
  type ProductFormValues,
} from "@/components/schemas/productFormSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useProductCatalog } from "@/hooks/useProductCatalog";
import {
  inferSubcategoryFromTitle,
} from "@/lib/catalog/inferSubcategoryFromTitle";
import { useProductStore } from "@/store/useProductStore";
import { brands } from "@/utils/config";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import {
  Box,
  DollarSign,
  List,
  Package,
  Sparkles,
  Tag,
  Users,
  Zap,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Controller,
  FormProvider,
  useForm,
} from "react-hook-form";

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

function ProductForm() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [categoryAutoLocked, setCategoryAutoLocked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    getProductById(getCurrentEditedProductId).then((product) => {
      if (!product) return;

      reset({
        name: product.name,
        brand: product.brand,
        description: product.description ?? "",
        category: product.category,
        gender: product.gender ?? "",
        price: product.price.toString(),
        stock: product.stock.toString(),
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
    });
  }, [
    isEditMode,
    getCurrentEditedProductId,
    getProductById,
    catalogDepartments,
    reset,
  ]);

  useEffect(() => {
    if (getCurrentEditedProductId !== null) return;

    reset(emptyProductFormValues);
    setSelectedFiles([]);
    setSelectedDepartmentId("");
    setSelectedSubcategoryId("");
    setCategoryAutoLocked(true);
  }, [getCurrentEditedProductId, reset]);

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
        router.push("/super-admin/products/list");
      }
    } catch (submitErr) {
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
      <div className="min-h-screen bg-gradient-to-b from-background to-card/30 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <header className="glass-effect rounded-2xl p-6 mb-8 border border-glass-border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <Package className="h-8 w-8 text-primary" />
                  {isEditMode ? "Edit Product" : "Create New Product"}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {isEditMode
                    ? "Update your futuristic product details"
                    : "Add a new product to your futuristic collection"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.push("/super-admin/products/list")}
                  className="border-border hover:border-primary"
                >
                  Back to List
                </Button>
                <div className="h-10 w-1 bg-border"></div>
                <span className="text-sm text-muted-foreground">
                  {isEditMode ? "Edit Mode" : "Create Mode"}
                </span>
              </div>
            </div>
          </header>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8"
            noValidate
          >
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
              <div className="glass-effect rounded-2xl p-6 border border-glass-border space-y-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Product Details
                </h2>

                <ProductFormCatalogAlerts
                  catalogLoading={catalogLoading}
                  catalogError={catalogError}
                  hasDepartments={catalogDepartments.length > 0}
                />

                <ProductFormField
                  label="Product Name"
                  name="name"
                  icon={<Package className="h-4 w-4" />}
                  error={errors.name?.message}
                >
                  <Input
                    id="name"
                    placeholder="Enter futuristic product name"
                    className="bg-input border-border focus:ring-primary/50"
                    aria-invalid={!!errors.name}
                    {...register("name")}
                  />
                </ProductFormField>

                <ProductFormField
                  label="Brand"
                  name="brand"
                  icon={<Tag className="h-4 w-4" />}
                  error={errors.brand?.message}
                >
                  <Controller
                    name="brand"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="brand"
                          className="bg-input border-border"
                          aria-invalid={!!errors.brand}
                        >
                          <SelectValue placeholder="Select futuristic brand" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {brands.map((item) => (
                            <SelectItem key={item} value={item.toLowerCase()}>
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-primary/20"></div>
                                {item}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </ProductFormField>

                <ProductFormField
                  label="Description"
                  name="description"
                  icon={<List className="h-4 w-4" />}
                  error={errors.description?.message}
                >
                  <Textarea
                    id="description"
                    className="min-h-[150px] bg-input border-border focus:ring-primary/50"
                    placeholder="Describe your futuristic product features..."
                    aria-invalid={!!errors.description}
                    {...register("description")}
                  />
                </ProductFormField>

                <ProductFormField
                  label="Department"
                  name="department"
                  icon={<List className="h-4 w-4" />}
                >
                  <Select
                    value={selectedDepartmentId || undefined}
                    onValueChange={handleDepartmentChange}
                    disabled={catalogLoading}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue
                        placeholder={
                          catalogLoading
                            ? "Loading departments…"
                            : "Select department"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {catalogDepartments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </ProductFormField>

                <ProductFormField
                  label="Subcategory"
                  name="subcategory"
                  icon={<Tag className="h-4 w-4" />}
                >
                  <Select
                    value={selectedSubcategoryId || undefined}
                    onValueChange={handleSubcategoryChange}
                    disabled={
                      !selectedDepartment ||
                      selectedDepartment.subcategories.length === 0
                    }
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {(selectedDepartment?.subcategories ?? []).map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </ProductFormField>

                <ProductFormField
                  label="Category (resolved)"
                  name="category"
                  icon={<List className="h-4 w-4" />}
                  error={errors.category?.message}
                >
                  <Input
                    id="category"
                    placeholder="Auto-filled from subcategory"
                    className="bg-input border-border focus:ring-primary/50"
                    aria-invalid={!!errors.category}
                    {...categoryRegister}
                    onChange={(e) => {
                      setCategoryAutoLocked(false);
                      categoryRegister.onChange(e);
                    }}
                  />
                </ProductFormField>

                <ProductFormField
                  label="Gender"
                  name="gender"
                  icon={<Users className="h-4 w-4" />}
                  error={errors.gender?.message}
                >
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="gender"
                          className="bg-input border-border"
                          aria-invalid={!!errors.gender}
                        >
                          <SelectValue placeholder="Select target gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="men">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                              Men
                            </div>
                          </SelectItem>
                          <SelectItem value="women">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-pink-500"></div>
                              Women
                            </div>
                          </SelectItem>
                          <SelectItem value="kids">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-green-500"></div>
                              Kids
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </ProductFormField>
              </div>

              <div className="glass-effect rounded-2xl p-6 border border-glass-border space-y-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Box className="h-5 w-5 text-secondary" />
                  Variants & Pricing
                </h2>

                <div className="space-y-1">
                  <ProductFormSizePicker
                    selectedSizes={sizesValue ?? []}
                    onToggleSize={toggleSize}
                  />
                  {errors.sizes?.message ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.sizes.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <ProductFormColorPicker
                    selectedColors={colorsValue ?? []}
                    onToggleColor={toggleColor}
                  />
                  {errors.colors?.message ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.colors.message}
                    </p>
                  ) : null}
                </div>

                <ProductFormField
                  label="Price"
                  name="price"
                  icon={<DollarSign className="h-4 w-4" />}
                  error={errors.price?.message}
                >
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </div>
                    <Input
                      id="price"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      className="pl-8 bg-input border-border focus:ring-primary/50"
                      aria-invalid={!!errors.price}
                      {...register("price")}
                    />
                  </div>
                </ProductFormField>

                <ProductFormField
                  label="Stock Quantity"
                  name="stock"
                  icon={<Box className="h-4 w-4" />}
                  error={errors.stock?.message}
                >
                  <Input
                    id="stock"
                    type="number"
                    min={0}
                    placeholder="Enter available stock"
                    className="bg-input border-border focus:ring-primary/50"
                    aria-invalid={!!errors.stock}
                    {...register("stock")}
                  />
                </ProductFormField>

                <div className="pt-6 border-t border-border">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                        {isEditMode ? "Updating..." : "Creating..."}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        {isEditMode
                          ? "Update Product"
                          : "Create Futuristic Product"}
                      </div>
                    )}
                  </Button>

                  {error && (
                    <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-destructive text-sm">{error}</p>
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-primary/5 border border-primary/10 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Tips for Success
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Use high-quality images (min. 1200x1200px)</li>
                      <li>• Provide detailed, futuristic descriptions</li>
                      <li>• Set competitive pricing for your market</li>
                      <li>• Select accurate categories for better visibility</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </FormProvider>
  );
}

export default ProductForm;
