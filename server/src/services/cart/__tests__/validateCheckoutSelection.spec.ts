const cartItemFindMany = jest.fn();

jest.mock("../../../lib/prisma", () => ({
  prisma: { cartItem: { findMany: (...a: unknown[]) => cartItemFindMany(...a) } },
}));

import { validateCheckoutSelection } from "../validateCheckoutSelection";

const line = (id: string, quantity: number, stock: number, price = 25) => ({
  id,
  quantity,
  size: "M",
  color: "Black",
  product: { id: `p-${id}`, name: `Product ${id}`, category: "Men", price, stock, isActive: true, isArchived: false },
});

describe("validateCheckoutSelection", () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([[undefined], ["ci-1"], [{}]])("rejects non-array input %p", async (input) => {
    await expect(validateCheckoutSelection("u1", input)).rejects.toMatchObject({
      statusCode: 400,
      message: "cartItemIds must be a non-empty array",
    });
    expect(cartItemFindMany).not.toHaveBeenCalled();
  });

  it("rejects arrays with no usable ids", async () => {
    await expect(validateCheckoutSelection("u1", ["", "  ", 5])).rejects.toMatchObject({
      message: "At least one cart item must be selected for checkout",
    });
  });

  it("de-duplicates and trims ids and scopes the query to the user's cart", async () => {
    cartItemFindMany.mockResolvedValueOnce([line("a", 1, 5)]);
    await validateCheckoutSelection("u1", [" a ", "a"]);
    expect(cartItemFindMany.mock.calls[0][0].where).toEqual({ id: { in: ["a"] }, cart: { userId: "u1" } });
  });

  it("rejects ids that are not in the user's cart", async () => {
    cartItemFindMany.mockResolvedValueOnce([line("a", 1, 5)]);
    await expect(validateCheckoutSelection("u1", ["a", "someone-elses"])).rejects.toMatchObject({
      statusCode: 400,
      message: "One or more selected cart items are invalid or do not belong to your cart",
    });
  });

  it("rejects lines whose product was deleted", async () => {
    cartItemFindMany.mockResolvedValueOnce([{ ...line("a", 1, 5), product: null }]);
    await expect(validateCheckoutSelection("u1", ["a"])).rejects.toMatchObject({
      message: "A selected product is no longer available",
    });
  });

  it.each([
    [{ isActive: false }],
    [{ isArchived: true }],
  ])("rejects inactive or archived products %o", async (flags) => {
    const row = line("a", 1, 5);
    cartItemFindMany.mockResolvedValueOnce([{ ...row, product: { ...row.product, ...flags } }]);
    await expect(validateCheckoutSelection("u1", ["a"])).rejects.toMatchObject({
      message: "A selected product is no longer available",
    });
  });

  it("rejects quantities above stock", async () => {
    cartItemFindMany.mockResolvedValueOnce([line("a", 3, 2)]);
    await expect(validateCheckoutSelection("u1", ["a"])).rejects.toMatchObject({
      message: "Insufficient stock for Product a. Available: 2",
    });
  });

  it("returns lines priced from the database in the requested order", async () => {
    cartItemFindMany.mockResolvedValueOnce([line("b", 1, 5, 10), line("a", 2, 5, 25)]);
    const result = await validateCheckoutSelection("u1", ["a", "b"]);
    expect(result).toEqual([
      { cartItemId: "a", productId: "p-a", productName: "Product a", productCategory: "Men", quantity: 2, size: "M", color: "Black", price: 25 },
      { cartItemId: "b", productId: "p-b", productName: "Product b", productCategory: "Men", quantity: 1, size: "M", color: "Black", price: 10 },
    ]);
  });
});
