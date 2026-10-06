import { z } from "zod";

const requiredText = (label: string, max: number) =>
  z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`).max(max, `${label} is too long`);

export const addressSchema = z.object({
  name: requiredText("Name", 100),
  address: requiredText("Address", 255),
  city: requiredText("City", 100),
  country: requiredText("Country", 100),
  postalCode: requiredText("Postal code", 20),
  phone: requiredText("Phone", 30).regex(/^[+()\d\s-]{5,30}$/, "Phone number is invalid"),
  isDefault: z.boolean().optional().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;
