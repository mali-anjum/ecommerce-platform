import { extractTextFromPlainText } from "../pdfTextExtractor";

jest.mock("pdf-parse", () =>
  jest.fn(async () => ({ text: "Extracted PDF content for testing." })),
);

import { extractDocumentText, extractTextFromPdf } from "../pdfTextExtractor";

describe("pdfTextExtractor", () => {
  it("extracts plain text files", () => {
    const text = extractTextFromPlainText(
      Buffer.from("Hello knowledge base", "utf8"),
    );
    expect(text).toBe("Hello knowledge base");
  });

  it("extracts pdf text via pdf-parse", async () => {
    const text = await extractTextFromPdf(Buffer.from("fake-pdf"));
    expect(text).toBe("Extracted PDF content for testing.");
  });

  it("routes by mime type", async () => {
    const pdfText = await extractDocumentText(
      Buffer.from("fake"),
      "application/pdf",
    );
    expect(pdfText).toContain("Extracted PDF");

    const txtText = await extractDocumentText(
      Buffer.from("manual entry", "utf8"),
      "text/plain",
    );
    expect(txtText).toBe("manual entry");
  });
});
