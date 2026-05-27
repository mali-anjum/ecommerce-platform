const findUniqueMock = jest.fn();

jest.mock("../../../lib/prisma", () => ({
  prisma: {
    product: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
  },
}));

import { findProductDetailById } from "../detail";

describe("findProductDetailById", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
  });

  it("selects stock and gender for storefront and admin edit flows", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "prod-1",
      stock: 12,
      gender: "unisex",
    });

    await findProductDetailById("prod-1");

    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "prod-1" },
        select: expect.objectContaining({
          stock: true,
          gender: true,
        }),
      })
    );
  });
});
