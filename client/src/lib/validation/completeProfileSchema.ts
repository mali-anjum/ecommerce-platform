import { z } from "zod";

export const completeProfileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(6, "Phone number is required"),
  country: z.string().min(2, "Country is required"),
  city: z.string().min(2, "City is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  address: z.string().min(5, "Street address is required"),
});

export type CompleteProfileForm = z.infer<typeof completeProfileSchema>;

