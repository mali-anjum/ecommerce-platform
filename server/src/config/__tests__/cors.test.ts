import { createCorsOptions } from "../cors";

describe("CORS origin policy", () => {
  const resolveOrigin = (
    origin: string | undefined,
    frontendUrl?: string,
  ): Promise<boolean> =>
    new Promise((resolve, reject) => {
      const originOption = createCorsOptions(frontendUrl).origin;
      if (typeof originOption !== "function") {
        reject(new Error("Expected a CORS origin callback"));
        return;
      }

      originOption(origin, (error, allowed) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(Boolean(allowed));
      });
    });

  it("allows exact configured and local frontend origins", async () => {
    await expect(
      resolveOrigin("https://shop.example.com", "https://shop.example.com"),
    ).resolves.toBe(true);
    await expect(resolveOrigin("http://localhost:3012")).resolves.toBe(true);
  });

  it("does not allow origins that merely contain an allowed hostname", async () => {
    await expect(
      resolveOrigin(
        "https://shop.example.com.attacker.test",
        "https://shop.example.com",
      ),
    ).rejects.toThrow("CORS policy violation");
  });

  it("handles an unset or invalid configured frontend origin", async () => {
    await expect(resolveOrigin("http://localhost:3012", undefined)).resolves.toBe(
      true,
    );
    await expect(
      resolveOrigin("https://attacker.test", "not a URL"),
    ).rejects.toThrow("CORS policy violation");
  });

  it("allows requests without an Origin header", async () => {
    await expect(resolveOrigin(undefined)).resolves.toBe(true);
  });
});
