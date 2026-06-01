import {
  detectOrderSupportSubIntent,
  extractOrderId,
  isOrderSupportQuery,
} from "../orderSupportParser";

describe("orderSupportParser", () => {
  it("detects order support queries", () => {
    expect(isOrderSupportQuery("Where is my order?")).toBe(true);
    expect(isOrderSupportQuery("What's my delivery status?")).toBe(true);
    expect(isOrderSupportQuery("I want to cancel my order")).toBe(true);
    expect(isOrderSupportQuery("Best laptops under $500")).toBe(false);
  });

  it("does not treat generic help questions as personal order lookup", () => {
    expect(isOrderSupportQuery("How do I track an order?")).toBe(false);
  });

  it("classifies sub-intents", () => {
    expect(detectOrderSupportSubIntent("Cancel my order please")).toBe(
      "cancel_request",
    );
    expect(detectOrderSupportSubIntent("When will my order arrive?")).toBe(
      "delivery_status",
    );
    expect(detectOrderSupportSubIntent("Where is my order?")).toBe(
      "track_order",
    );
  });

  it("extracts order UUID from message", () => {
    const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    expect(extractOrderId(`Track order ${id}`)).toBe(id);
  });
});
