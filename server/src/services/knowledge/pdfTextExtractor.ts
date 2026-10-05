import { PDFParse } from "pdf-parse";

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text.replace(/\s+\n/g, "\n").trim();
  } finally {
    await parser.destroy();
  }
}

export function extractTextFromPlainText(buffer: Buffer): string {
  return buffer.toString("utf8").trim();
}

export async function extractDocumentText(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (mimeType === "application/pdf") {
    return extractTextFromPdf(buffer);
  }
  if (mimeType === "text/plain") {
    return extractTextFromPlainText(buffer);
  }
  throw new Error(`Unsupported document type: ${mimeType}`);
}
