import { unwrapData } from "@/lib/api/adminApiClient";

describe("adminApiClient", () => {
  it("unwrapData extracts nested data field", () => {
    const response = {
      data: {
        data: { faqs: [{ id: "1", question: "Q", answer: "A" }] },
      },
    };
    expect(unwrapData<{ faqs: unknown[] }>(response).faqs).toHaveLength(1);
  });
});
