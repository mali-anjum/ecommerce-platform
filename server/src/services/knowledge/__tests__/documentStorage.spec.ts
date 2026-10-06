const uploadStream = jest.fn();
jest.mock("../../../config/cloudinary", () => ({
  __esModule: true,
  default: { uploader: { upload_stream: (...args: unknown[]) => uploadStream(...args) } },
}));
jest.mock("fs/promises", () => ({ mkdir: jest.fn(), writeFile: jest.fn() }));

import { mkdir, writeFile } from "fs/promises";
import { persistDocumentFile } from "../documentStorage";

type UploadCallback = (error: Error | null, result?: { secure_url?: string }) => void;

function cloudinaryResponds(error: Error | null, result?: { secure_url?: string }) {
  uploadStream.mockImplementation((_options: unknown, callback: UploadCallback) => ({
    end: () => callback(error, result),
  }));
}

describe("persistDocumentFile", () => {
  const buffer = Buffer.from("pdf");

  beforeEach(() => {
    uploadStream.mockReset();
    (mkdir as jest.Mock).mockReset().mockResolvedValue(undefined);
    (writeFile as jest.Mock).mockReset().mockResolvedValue(undefined);
  });

  it("returns the Cloudinary URL and uploads as a raw file with a sanitized id", async () => {
    cloudinaryResponds(null, { secure_url: "https://res.cloudinary.com/x/raw/doc.pdf" });
    await expect(persistDocumentFile(buffer, "../../etc/pass wd.pdf")).resolves.toBe(
      "https://res.cloudinary.com/x/raw/doc.pdf"
    );
    const options = uploadStream.mock.calls[0][0] as { resource_type: string; folder: string; public_id: string };
    expect(options.resource_type).toBe("raw");
    expect(options.folder).toBe("knowledge-base");
    expect(options.public_id).toMatch(/^[0-9a-f-]{36}-\.\._\.\._etc_pass_wd\.pdf$/);
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("falls back to local storage when Cloudinary fails, with no path traversal", async () => {
    cloudinaryResponds(new Error("cloudinary down"));
    const url = await persistDocumentFile(buffer, "../secret/../../x.pdf");

    expect(url).toMatch(/^\/uploads\/knowledge-base\/[0-9a-f-]{36}-[\w.-]+$/);
    expect(url?.split("/")).toHaveLength(4);
    const [filePath, written] = (writeFile as jest.Mock).mock.calls[0];
    expect(String(filePath)).toContain("uploads/knowledge-base/");
    expect(String(filePath)).not.toContain("/../");
    expect(written).toBe(buffer);
  });

  it("treats a Cloudinary result without secure_url as a failure", async () => {
    cloudinaryResponds(null, {});
    await expect(persistDocumentFile(buffer, "a.pdf")).resolves.toMatch(/^\/uploads\/knowledge-base\//);
  });

  it("returns null when both Cloudinary and local storage fail", async () => {
    cloudinaryResponds(new Error("down"));
    (writeFile as jest.Mock).mockRejectedValue(new Error("EACCES"));
    await expect(persistDocumentFile(buffer, "a.pdf")).resolves.toBeNull();
  });

  it("truncates very long file names", async () => {
    cloudinaryResponds(null, { secure_url: "u" });
    await persistDocumentFile(buffer, `${"a".repeat(300)}.pdf`);
    const { public_id } = uploadStream.mock.calls[0][0] as { public_id: string };
    expect(public_id.length).toBe(36 + 1 + 120);
  });
});
