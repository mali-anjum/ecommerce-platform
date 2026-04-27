import { productFormSchema } from "../productFormSchema";

describe("productFormSchema", () => {
  const valid = {
    name: "Test Product",
    brand: "nike",
    description: "A great product for testing the form schema.",
    category: "Shoes",
    gender: "men",
    price: "99.99",
    stock: "10",
    sizes: ["M", "L"],
    colors: ["Black", "White"],
  };

  it("accepts a complete valid payload", () => {
    const result = productFormSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects when no sizes are selected", () => {
    const result = productFormSchema.safeParse({ ...valid, sizes: [] });
    expect(result.success).toBe(false);
  });

  it("rejects invalid price", () => {
    const result = productFormSchema.safeParse({ ...valid, price: "x" });
    expect(result.success).toBe(false);
  });
});
