import { Prisma } from "@prisma/client";
import { isPrismaNotFound } from "../prismaErrors";

const known = (code: string) => new Prisma.PrismaClientKnownRequestError("x", { code, clientVersion: "t" });

describe("isPrismaNotFound", () => {
  it("is true only for P2025", () => {
    expect(isPrismaNotFound(known("P2025"))).toBe(true);
    expect(isPrismaNotFound(known("P2002"))).toBe(false);
    expect(isPrismaNotFound(new Error("P2025"))).toBe(false);
    expect(isPrismaNotFound(undefined)).toBe(false);
  });
});
