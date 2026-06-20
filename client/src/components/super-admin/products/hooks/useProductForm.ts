"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  type ProductFormValues, 
  emptyProductFormValues, 
  productFormSchema 
} from "@/components/schemas/productFormSchema";

interface UseProductFormProps {
  defaultValues?: Partial<ProductFormValues>;
}

export function useProductForm({ defaultValues }: UseProductFormProps = {}) {
  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      ...emptyProductFormValues,
      ...defaultValues,
    },
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
    formState: { errors, isDirty },
  } = methods;

  return {
    ...methods,
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    errors,
    isDirty,
  };
}