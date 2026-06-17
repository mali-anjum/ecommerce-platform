import * as z from "zod";

export const emptyProductFormValues = {
  name: "",
  brand: "",
  description: "",
  seoTitle: "",
  metaDescription: "",
  seoKeywords: "",
  category: "",
  gender: "",
  price: "",
  stock: "",
  sizes: [] as string[],
  colors: [] as string[],
};

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  brand: z.string().min(1, "Select a brand"),
  description: z.string().trim().min(1, "Description is required"),
  seoTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  category: z.string().trim().min(1, "Category is required"),
  gender: z.string().min(1, "Select a gender"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine(
      (v) => !Number.isNaN(Number(v)) && Number(v) >= 0,
      "Enter a valid price"
    ),
  stock: z
    .string()
    .min(1, "Stock is required")
    .refine(
      (v) => !Number.isNaN(Number.parseInt(v, 10)) && Number.parseInt(v, 10) >= 0,
      "Enter a valid stock quantity"
    ),
  sizes: z.array(z.string()).min(1, "Select at least one size"),
  colors: z.array(z.string()).min(1, "Select at least one color"),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
