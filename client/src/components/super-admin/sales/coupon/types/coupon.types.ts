// src/types/coupon.types.ts
export interface CouponFormData {
  code: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
}

export interface CouponFormProps {
  initialData?: Partial<CouponFormData>;
  onSubmit?: (data: CouponFormData) => void;
  onCancel?: () => void;
}

export interface CouponFormState {
  isSubmitting: boolean;
  isGenerating: boolean;
  generatedCodes: string[];
}

export interface CouponValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}