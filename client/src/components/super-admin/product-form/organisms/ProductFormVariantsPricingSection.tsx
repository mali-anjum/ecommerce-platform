import { ProductFormField } from "@/components/super-admin/product-form/atoms/ProductFormField";
import {
  ProductFormColorPicker,
  ProductFormSizePicker,
} from "@/components/super-admin/product-form/molecules/ProductFormVariantPickers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Box, DollarSign, Sparkles, Zap } from "lucide-react";
import type { FieldErrors, UseFormRegisterReturn } from "react-hook-form";
import type { ProductFormValues } from "@/components/schemas/productFormSchema";

type ProductFormVariantsPricingSectionProps = {
  isEditMode: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  selectedSizes: string[];
  selectedColors: string[];
  onToggleSize: (size: string) => void;
  onToggleColor: (color: string) => void;
  errors: FieldErrors<ProductFormValues>;
  registerPrice: UseFormRegisterReturn<"price">;
  registerStock: UseFormRegisterReturn<"stock">;
};

export function ProductFormVariantsPricingSection({
  isEditMode,
  isSubmitting,
  errorMessage,
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
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Box className="h-5 w-5 text-secondary" />
        Variants & Pricing
      </h2>

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

      <div className="pt-6 border-t border-border">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              {isEditMode ? "Updating..." : "Creating..."}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {isEditMode ? "Update Product" : "Create Futuristic Product"}
            </div>
          )}
        </Button>

        {errorMessage ? (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{errorMessage}</p>
          </div>
        ) : null}

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
  );
}

