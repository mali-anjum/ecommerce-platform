import {
  mapOrdersWithLegacyPaymentAliases,
  withLegacyPaymentAliases,
} from "../paymentDto";

describe("paymentDto legacy aliases", () => {
  it("maps latest payment to paymentId and providerOrderId", () => {
    const order = {
      id: "ord-1",
      payments: [
        {
          id: "pay-2",
          providerReferenceId: "PP_NEW",
          providerCaptureId: null,
        },
        {
          id: "pay-1",
          providerReferenceId: "PP_OLD",
          providerCaptureId: "cap",
        },
      ],
    };
    const out = withLegacyPaymentAliases(order as any);
    expect(out.paymentId).toBe("PP_NEW");
    expect(out.providerOrderId).toBe("PP_NEW");
    expect(out.providerCaptureId).toBeNull();
  });

  it("maps arrays of orders", () => {
    const orders = [
      {
        id: "a",
        payments: [{ providerReferenceId: "X", providerCaptureId: null }],
      },
    ];
    const out = mapOrdersWithLegacyPaymentAliases(orders as any);
    expect(out[0].paymentId).toBe("X");
  });
});
