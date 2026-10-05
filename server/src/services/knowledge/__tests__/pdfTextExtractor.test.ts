import { extractTextFromPlainText } from "../pdfTextExtractor";

const mockDestroy = jest.fn(async () => undefined);

jest.mock("pdf-parse", () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: jest.fn(async () => ({ text: "Extracted PDF content for testing." })),
    destroy: mockDestroy,
  })),
}));

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
    expect(mockDestroy).toHaveBeenCalled();
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
