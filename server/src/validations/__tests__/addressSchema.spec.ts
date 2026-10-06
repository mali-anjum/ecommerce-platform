import { addressSchema } from "../addressSchema";

const valid = {
  name: "  Ann Lee ",
  address: "1 Main St",
  city: "Lahore",
  country: "Pakistan",
  postalCode: "54000",
  phone: "+92 300-1234567",
};

describe("addressSchema", () => {
  it("trims values and defaults isDefault to false", () => {
    expect(addressSchema.parse(valid)).toEqual({ ...valid, name: "Ann Lee", isDefault: false });
  });

  it("keeps an explicit isDefault and strips unknown fields", () => {
    const parsed = addressSchema.parse({ ...valid, isDefault: true, userId: "attacker" });
    expect(parsed.isDefault).toBe(true);
    expect(parsed).not.toHaveProperty("userId");
  });

  it.each(["name", "address", "city", "country", "postalCode", "phone"])("requires %s", (field) => {
    const result = addressSchema.safeParse({ ...valid, [field]: "   " });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toEqual([field]);
  });

  it.each(["abc", "12", "+1 <script>"])("rejects invalid phone %p", (phone) => {
    expect(addressSchema.safeParse({ ...valid, phone }).success).toBe(false);
  });

  it("rejects overlong values", () => {
    expect(addressSchema.safeParse({ ...valid, postalCode: "1".repeat(21) }).success).toBe(false);
  });

  it("rejects a non-boolean isDefault", () => {
    expect(addressSchema.safeParse({ ...valid, isDefault: "yes" }).success).toBe(false);
  });
});
