import type { OAuthProvider } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { OAuthAccountService } from "../OAuthAccountService";

jest.mock("../../../../lib/prisma", () => ({
  prisma: {
    oAuthAccount: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { prisma } from "../../../../lib/prisma";

function uniqueError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Unique", {
    code: "P2002",
    clientVersion: "test",
  });
}

describe("OAuthAccountService", () => {
  const service = new OAuthAccountService();
  const provider = "GOOGLE" as OAuthProvider;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("does not overwrite name/image on repeat login when already set", async () => {
    (prisma.oAuthAccount.findUnique as jest.Mock).mockResolvedValue({
      userId: "user-1",
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      name: "Existing Name",
      image: "http://existing",
      emailVerified: true,
    });
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    await service.findOrCreateUserFromOAuth({
      provider,
      providerUserId: "sub-1",
      email: "test@example.com",
      name: "New Name",
      image: "http://new",
      emailVerified: true,
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.not.objectContaining({ name: "New Name", image: "http://new" }),
      }),
    );
  });

  it("requires emailVerified === true to link by email", async () => {
    (prisma.oAuthAccount.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-1",
      name: "Existing",
      image: null,
      emailVerified: false,
    });

    await expect(
      service.findOrCreateUserFromOAuth({
        provider,
        providerUserId: "sub-1",
        email: "test@example.com",
        emailVerified: false,
      }),
    ).rejects.toThrow(/did not verify this email/i);
  });

  it("handles race unique constraint on oauth account creation by fetching linked account", async () => {
    (prisma.oAuthAccount.findUnique as jest.Mock)
      .mockResolvedValueOnce(null) // no existing account
      .mockResolvedValueOnce({ userId: "user-1" }); // after race

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-1",
      name: null,
      image: null,
      emailVerified: false,
    });

    (prisma.$transaction as jest.Mock).mockRejectedValue(uniqueError());

    const result = await service.findOrCreateUserFromOAuth({
      provider,
      providerUserId: "sub-1",
      email: "test@example.com",
      emailVerified: true,
      name: "Name",
      image: "http://img",
    });

    expect(result).toEqual({ userId: "user-1", isNewUser: false });
  });
});

