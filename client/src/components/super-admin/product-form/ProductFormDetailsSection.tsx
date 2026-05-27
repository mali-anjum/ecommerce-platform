import { ProductFormCatalogAlerts } from "@/components/super-admin/product-form/ProductFormCatalogAlerts";
import { ProductFormField } from "@/components/super-admin/product-form/ProductFormField";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { brands } from "@/utils/config";
import { List, Package, Tag, Users } from "lucide-react";
import type { Control, FieldErrors, UseFormRegisterReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { ProductFormValues } from "@/components/schemas/productFormSchema";

type Department = {
  id: string;
  title: string;
  slug?: string;
  subcategories: Array<{
    id: string;
    title: string;
    slug?: string;
  }>;
};

type ProductFormDetailsSectionProps = {
  catalogDepartments: Department[];
  catalogLoading: boolean;
  catalogError: string | null;
  selectedDepartmentId: string;
  selectedSubcategoryId: string;
  selectedDepartment: Department | undefined;
  onDepartmentChange: (departmentId: string) => void;
  onSubcategoryChange: (subcategoryId: string) => void;
  onCategoryManualChange: () => void;
  errors: FieldErrors<ProductFormValues>;
  registerName: UseFormRegisterReturn<"name">;
  registerDescription: UseFormRegisterReturn<"description">;
  registerCategory: UseFormRegisterReturn<"category">;
  control: Control<ProductFormValues>;
};

export function ProductFormDetailsSection({
  catalogDepartments,
  catalogLoading,
  catalogError,
  selectedDepartmentId,
  selectedSubcategoryId,
  selectedDepartment,
  onDepartmentChange,
  onSubcategoryChange,
  onCategoryManualChange,
  errors,
  registerName,
  registerDescription,
  registerCategory,
  control,
}: ProductFormDetailsSectionProps) {
  return (
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
          {...registerName}
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
                      <div className="h-3 w-3 rounded-full bg-primary/20" />
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
          {...registerDescription}
        />
      </ProductFormField>

      <ProductFormField
        label="Department"
        name="department"
        icon={<List className="h-4 w-4" />}
      >
        <Select
          value={selectedDepartmentId || undefined}
          onValueChange={onDepartmentChange}
          disabled={catalogLoading}
        >
          <SelectTrigger className="bg-input border-border">
            <SelectValue
              placeholder={
                catalogLoading ? "Loading departments…" : "Select department"
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
          onValueChange={onSubcategoryChange}
          disabled={
            !selectedDepartment || selectedDepartment.subcategories.length === 0
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
          {...registerCategory}
          onChange={(e) => {
            onCategoryManualChange();
            registerCategory.onChange(e);
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
            <Select value={field.value || undefined} onValueChange={field.onChange}>
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
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    Men
                  </div>
                </SelectItem>
                <SelectItem value="women">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-pink-500" />
                    Women
                  </div>
                </SelectItem>
                <SelectItem value="kids">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    Kids
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </ProductFormField>
    </div>
  );
}

