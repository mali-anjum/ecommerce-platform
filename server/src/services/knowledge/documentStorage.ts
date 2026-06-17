import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import cloudinary from "../../config/cloudinary";

const LOCAL_DIR = path.join(process.cwd(), "uploads", "knowledge-base");

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.-]+/g, "_").slice(0, 120);
}

async function saveLocalFile(
  buffer: Buffer,
  originalName: string,
): Promise<string> {
  await mkdir(LOCAL_DIR, { recursive: true });
  const safeName = `${randomUUID()}-${sanitizeFilename(originalName)}`; // TODO: What the filename would be?
  const filePath = path.join(LOCAL_DIR, safeName);
  await writeFile(filePath, buffer);
  return `/uploads/knowledge-base/${safeName}`;
}
// TODO: Is this duplicate as we have the upload for the product
function uploadToCloudinary(
  buffer: Buffer,
  originalName: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "knowledge-base",
        public_id: `${randomUUID()}-${sanitizeFilename(originalName)}`,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result.secure_url);
      },
    );
    uploadStream.end(buffer);
  });
}
// TODO: why local file is saved locally? Is this can happen in production and is this okay? 
export async function persistDocumentFile(
  buffer: Buffer,
  originalName: string,
): Promise<string | null> {
  try {
    return await uploadToCloudinary(buffer, originalName);
  } catch {
    try {
      return await saveLocalFile(buffer, originalName);
    } catch {
      return null;
    }
  }
}
