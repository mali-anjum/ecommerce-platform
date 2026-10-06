import axios from "axios";
import { pickDefaultAddressId } from "../useCheckoutAddress";
import { selectCheckoutItems, toCartItemWithProduct } from "../useCheckoutCart";
import { requestPaymentMethods } from "../usePaymentMethods";
import type { Address } from "@/components/storefront/checkout/types";
import type { CartItem } from "@/components/storefront/cart/types/cartItemStore";

jest.mock("@/lib/monitoring", () => ({ sentryTracker: jest.fn() }));
jest.mock("axios", () => {
  const actual = jest.requireActual("axios");
  return { ...actual, __esModule: true, default: { ...actual.default, get: jest.fn() } };
});

const address = (id: string, isDefault = false): Address => ({
  id,
  name: "Ann",
  address: "1 Main",
  city: "Lahore",
  country: "PK",
  postalCode: "54000",
  phone: "+92 300 0000000",
  isDefault,
});

describe("pickDefaultAddressId", () => {
  it("prefers the default address", () => {
    expect(pickDefaultAddressId([address("a"), address("b", true)])).toBe("b");
  });

  it("falls back to the first address", () => {
    expect(pickDefaultAddressId([address("a"), address("b")])).toBe("a");
  });

  it("returns an empty string with no addresses", () => {
    expect(pickDefaultAddressId([])).toBe("");
  });
});

describe("toCartItemWithProduct", () => {
  it("maps a cart line and fills safe defaults", () => {
    const item = { id: "ci", productId: "p", quantity: 2, size: "M", color: "Black", name: "", price: 0, image: "" } as CartItem;
    expect(toCartItemWithProduct(item)).toEqual({
      id: "ci",
      productId: "p",
      quantity: 2,
      size: "M",
      color: "Black",
      product: { id: "p", name: "Product", price: 0, category: "General", images: [] },
    });
  });

  it("keeps the image when present", () => {
    const item = { id: "ci", productId: "p", quantity: 1, size: "", color: "", name: "Lamp", price: 9, image: "x.jpg", category: "Lighting" } as CartItem;
    expect(toCartItemWithProduct(item).product).toMatchObject({ name: "Lamp", price: 9, images: ["x.jpg"], category: "Lighting" });
  });
});

describe("selectCheckoutItems", () => {
  const items = ["a", "b", "c"].map((id) => toCartItemWithProduct({ id, productId: id, quantity: 1 } as CartItem));

  it("returns nothing when nothing is selected", () => {
    expect(selectCheckoutItems(items, [])).toEqual([]);
  });

  it("keeps only selected lines in cart order", () => {
    expect(selectCheckoutItems(items, ["c", "a", "zzz"]).map((i) => i.id)).toEqual(["a", "c"]);
  });
});

describe("requestPaymentMethods", () => {
  const get = axios.get as jest.Mock;
  beforeEach(() => {
    get.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it("returns the enabled methods", async () => {
    get.mockResolvedValueOnce({ data: { success: true, data: ["STRIPE"] } });
    await expect(requestPaymentMethods()).resolves.toEqual({ methods: ["STRIPE"], error: null });
    expect(get).toHaveBeenCalledWith("/api/order/methods");
  });

  it("treats a malformed body as no methods", async () => {
    get.mockResolvedValueOnce({ data: { success: true, data: "STRIPE" } });
    await expect(requestPaymentMethods()).resolves.toEqual({ methods: [], error: null });
  });

  it("never throws and reports an error message", async () => {
    get.mockRejectedValueOnce(new Error("down"));
    await expect(requestPaymentMethods()).resolves.toEqual({ methods: [], error: "Could not load payment methods" });
  });
});
