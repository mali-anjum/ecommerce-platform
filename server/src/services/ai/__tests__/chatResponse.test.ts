import { isProductSearchIntent, toPublicChatPayload } from "../chatResponse";
import type { AssistantChatResult } from "../types";

describe("chatResponse", () => {
  it("toPublicChatPayload omits legacy intent field", () => {
    const result: AssistantChatResult = {
      intent: "product_recommendation",
      classifiedIntent: "PRODUCT_SEARCH",
      reply: "Here are some options.",
      products: [],
      productIdsReferenced: [],
      orders: [],
    };

    const payload = toPublicChatPayload(result);
    expect(payload.classifiedIntent).toBe("PRODUCT_SEARCH");
    expect("intent" in payload).toBe(false);
  });

  it("isProductSearchIntent supports legacy log values", () => {
    expect(isProductSearchIntent("PRODUCT_SEARCH")).toBe(true);
    expect(isProductSearchIntent("product_recommendation")).toBe(true);
    expect(isProductSearchIntent("FAQ")).toBe(false);
  });
});
