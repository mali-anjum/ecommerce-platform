import type { UploadApiResponse } from "cloudinary";
import cloudinary from "../../config/cloudinary";

/** Streams an in-memory upload (multer memoryStorage) to Cloudinary and returns its HTTPS URL. */
export function uploadImageBuffer(buffer: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result?: UploadApiResponse) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary upload returned no URL"));
          return;
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}
