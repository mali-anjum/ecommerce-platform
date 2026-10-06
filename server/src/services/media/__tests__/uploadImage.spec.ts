const uploadStream = jest.fn();

jest.mock("../../../config/cloudinary", () => ({
  __esModule: true,
  default: { uploader: { upload_stream: (...a: unknown[]) => uploadStream(...a) } },
}));

import { uploadImageBuffer } from "../uploadImage";

type Callback = (error: unknown, result?: { secure_url?: string }) => void;

function mockStream(outcome: { error?: unknown; result?: { secure_url?: string } }) {
  const end = jest.fn();
  uploadStream.mockImplementationOnce((_opts: unknown, cb: Callback) => {
    end.mockImplementation(() => cb(outcome.error ?? null, outcome.result));
    return { end };
  });
  return end;
}

describe("uploadImageBuffer", () => {
  beforeEach(() => uploadStream.mockReset());

  it("streams the buffer into the folder and resolves the HTTPS URL", async () => {
    const end = mockStream({ result: { secure_url: "https://res.cloudinary.com/x.jpg" } });
    const buf = Buffer.from("img");
    await expect(uploadImageBuffer(buf, "banners")).resolves.toBe("https://res.cloudinary.com/x.jpg");
    expect(uploadStream.mock.calls[0][0]).toEqual({ folder: "banners", resource_type: "image" });
    expect(end).toHaveBeenCalledWith(buf);
  });

  it("rejects when Cloudinary reports an error", async () => {
    mockStream({ error: new Error("quota") });
    await expect(uploadImageBuffer(Buffer.from("x"), "f")).rejects.toThrow("quota");
  });

  it("rejects when no URL comes back", async () => {
    mockStream({ result: {} });
    await expect(uploadImageBuffer(Buffer.from("x"), "f")).rejects.toThrow("Cloudinary upload returned no URL");
  });
});
