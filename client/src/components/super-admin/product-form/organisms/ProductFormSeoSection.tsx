"use client";

import { ProductFormField } from "@/components/super-admin/product-form/atoms/ProductFormField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Sparkles, Wand2 } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { ProductFormValues } from "@/components/schemas/productFormSchema";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { generateSeoContent } from "@/lib/seo-generator/generateSeoContent";
import type { SeoContentResult, SeoTone } from "@/lib/seo-generator/types";
import { useState } from "react";
import { useToast } from "@/components/ui/hooks/use-toast";

type ProductFormSeoSectionProps = {
  errors: FieldErrors<ProductFormValues>;
  registerSeoTitle: ReturnType<UseFormRegister<ProductFormValues>>;
  registerMetaDescription: ReturnType<UseFormRegister<ProductFormValues>>;
  registerSeoKeywords: ReturnType<UseFormRegister<ProductFormValues>>;
  productName: string;
  brand: string;
  category: string;
  onApplyGeneratedContent: (content: SeoContentResult) => void;
};

export function ProductFormSeoSection({
  errors,
  registerSeoTitle,
  registerMetaDescription,
  registerSeoKeywords,
  productName,
  brand,
  category,
  onApplyGeneratedContent,
}: ProductFormSeoSectionProps) {
  const { toast } = useToast();
  const aiSeoEnabled = isFeatureEnabled("ai.seoGenerator");
  const [tone, setTone] = useState<SeoTone>("professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleGenerate = async () => {
    const trimmedName = productName.trim();
    if (trimmedName.length < 2) {
      setGenerateError("Enter a product name in step 1 first (at least 2 characters).");
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const content = await generateSeoContent({
        productName: trimmedName,
        tone,
        ...(category.trim() ? { category: category.trim() } : {}),
        ...(brand.trim() ? { brand: brand.trim() } : {}),
      });
      onApplyGeneratedContent(content);
      toast({
        title: "SEO content applied",
        description:
          "Description and SEO fields were filled. Review and edit before saving.",
      });
    } catch {
      setGenerateError(
        "Could not generate SEO content. Check AI settings and API keys on the server.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section
      id="product-form-seo"
      className="rounded-xl border border-border/60 bg-card/50 p-5 space-y-4 lg:col-span-2 scroll-mt-6"
      aria-labelledby="product-seo-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
            Step 3
          </p>
          <h3
            id="product-seo-heading"
            className="text-lg font-semibold flex items-center gap-2"
          >
            <Search className="h-4 w-4 text-primary" />
            SEO & discovery
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Optional fields for Google and social link previews. Leave blank to
            use the product name on the storefront.
          </p>
        </div>

        {aiSeoEnabled ? (
          <div className="flex flex-col gap-2 sm:items-end shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="seo-tone" className="sr-only">
                Tone
              </Label>
              <Select
                value={tone}
                onValueChange={(value) => setTone(value as SeoTone)}
              >
                <SelectTrigger id="seo-tone" className="w-[140px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isGenerating}
                onClick={() => void handleGenerate()}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate with AI
              </Button>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Fills description + SEO fields from step 1
            </p>
          </div>
        ) : null}
      </div>

      {generateError ? (
        <p className="text-sm text-destructive" role="alert">
          {generateError}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <ProductFormField
          label="SEO title"
          name="seoTitle"
          icon={<Search className="h-4 w-4" />}
          error={errors.seoTitle?.message}
        >
          <Input
            id="seoTitle"
            placeholder="Gaming Mouse | Shop Electronics"
            className="bg-input border-border"
            {...registerSeoTitle}
          />
        </ProductFormField>

        <ProductFormField
          label="Meta keywords"
          name="seoKeywords"
          icon={<Search className="h-4 w-4" />}
          error={errors.seoKeywords?.message}
        >
          <Input
            id="seoKeywords"
            placeholder="gaming mouse, wireless, rgb"
            className="bg-input border-border"
            {...registerSeoKeywords}
          />
        </ProductFormField>
      </div>

      <ProductFormField
        label="Meta description"
        name="metaDescription"
        icon={<Search className="h-4 w-4" />}
        error={errors.metaDescription?.message}
      >
        <Textarea
          id="metaDescription"
          rows={3}
          placeholder="Short summary for Google and social previews (max ~160 characters)."
          className="bg-input border-border resize-y"
          {...registerMetaDescription}
        />
      </ProductFormField>
    </section>
  );
}
