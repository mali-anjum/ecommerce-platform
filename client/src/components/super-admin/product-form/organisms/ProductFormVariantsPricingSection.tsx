import { ProductFormField } from "@/components/super-admin/product-form/atoms/ProductFormField";
import {
  ProductFormColorPicker,
  ProductFormSizePicker,
} from "@/components/super-admin/product-form/molecules/ProductFormVariantPickers";
import { Input } from "@/components/ui/input";
import { Box, DollarSign } from "lucide-react";
import type { FieldErrors, UseFormRegisterReturn } from "react-hook-form";
import type { ProductFormValues } from "@/components/schemas/productFormSchema";

type ProductFormVariantsPricingSectionProps = {
  selectedSizes: string[];
  selectedColors: string[];
  onToggleSize: (size: string) => void;
  onToggleColor: (color: string) => void;
  errors: FieldErrors<ProductFormValues>;
  registerPrice: UseFormRegisterReturn<"price">;
  registerStock: UseFormRegisterReturn<"stock">;
};

export function ProductFormVariantsPricingSection({
  selectedSizes,
  selectedColors,
  onToggleSize,
  onToggleColor,
  errors,
  registerPrice,
  registerStock,
}: ProductFormVariantsPricingSectionProps) {
  return (
    <div className="glass-effect rounded-2xl p-6 border border-glass-border space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
          Step 2
        </p>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Box className="h-5 w-5 text-secondary" />
          Pricing & inventory
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Variants, price, and stock quantity available to sell.
        </p>
      </div>

      <div className="space-y-1">
        <ProductFormSizePicker
          selectedSizes={selectedSizes}
          onToggleSize={onToggleSize}
        />
        {errors.sizes?.message ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.sizes.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <ProductFormColorPicker
          selectedColors={selectedColors}
          onToggleColor={onToggleColor}
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
            {...registerPrice}
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
          {...registerStock}
        />
      </ProductFormField>
    </div>
  );
}

