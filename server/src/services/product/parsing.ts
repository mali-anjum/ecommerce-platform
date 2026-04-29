import { ProductCondition } from "@prisma/client";

export function parseProductConditionValue(
  value: unknown
): ProductCondition | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toUpperCase();
  if (normalized === "NEW") return ProductCondition.NEW;
  if (normalized === "REFURBISHED") return ProductCondition.REFURBISHED;
  if (normalized === "USED") return ProductCondition.USED;
  return undefined;
}
