import { SalesOfferTrigger } from "@prisma/client";
import { pickPrimaryTrigger } from "../BehaviorSignalService";

describe("pickPrimaryTrigger", () => {
  it("prioritizes cart abandonment over browsing signals", () => {
    expect(
      pickPrimaryTrigger([
        SalesOfferTrigger.HIGH_BROWSING,
        SalesOfferTrigger.CART_ABANDON,
        SalesOfferTrigger.PRODUCT_CLUSTER,
      ]),
    ).toBe(SalesOfferTrigger.CART_ABANDON);
  });

  it("returns null when no triggers are present", () => {
    expect(pickPrimaryTrigger([])).toBeNull();
  });
});
