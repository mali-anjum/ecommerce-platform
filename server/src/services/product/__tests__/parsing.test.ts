import { ProductCondition } from "@prisma/client";
import { parseProductConditionValue } from "../parsing";

describe("parseProductConditionValue", () => {
  it("maps valid strings", () => {
    expect(parseProductConditionValue("new")).toBe(ProductCondition.NEW);
    expect(parseProductConditionValue("REFURBISHED")).toBe(
      ProductCondition.REFURBISHED
    );
  });

  it("returns undefined for invalid input", () => {
    expect(parseProductConditionValue("nope")).toBeUndefined();
    expect(parseProductConditionValue(1)).toBeUndefined();
  });
});
