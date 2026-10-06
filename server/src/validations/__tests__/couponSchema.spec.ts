import { createCouponSchema, validateCouponSchema } from "../couponSchema";

const valid = {
  code: " ABE-KOL-42 ",
  discountPercent: "15",
  startDate: "2026-06-01",
  endDate: "2026-07-01",
  usageLimit: "100",
};

describe("createCouponSchema", () => {
  it("coerces form input into typed values and trims the code", () => {
    const parsed = createCouponSchema.parse(valid);
    expect(parsed).toEqual({
      code: "ABE-KOL-42",
      discountPercent: 15,
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-07-01"),
      usageLimit: 100,
    });
  });

  it.each([
    ["code", "ab", "Code must be at least 3 characters"],
    ["code", "BAD CODE!", "Code may only contain letters, numbers, - and _"],
    ["discountPercent", "0", "Discount must be greater than 0"],
    ["discountPercent", "101", "Discount cannot exceed 100%"],
    ["discountPercent", "abc", undefined],
    ["usageLimit", "0", "Usage limit must be at least 1"],
    ["usageLimit", "2.5", "Usage limit must be a whole number"],
    ["startDate", "not-a-date", undefined],
  ])("rejects %s=%p", (field, value, message) => {
    const result = createCouponSchema.safeParse({ ...valid, [field]: value });
    expect(result.success).toBe(false);
    if (!result.success && message) {
      expect(result.error.issues.map((i) => i.message)).toContain(message);
    }
  });

  it("rejects an end date that is not after the start date", () => {
    const result = createCouponSchema.safeParse({ ...valid, endDate: "2026-06-01" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({ path: ["endDate"], message: "End date must be after the start date" });
    }
  });
});

describe("validateCouponSchema", () => {
  it("trims and requires a code", () => {
    expect(validateCouponSchema.parse({ code: "  SAVE10 " })).toEqual({ code: "SAVE10" });
    expect(validateCouponSchema.safeParse({ code: "   " }).success).toBe(false);
    expect(validateCouponSchema.safeParse({}).success).toBe(false);
  });
});
