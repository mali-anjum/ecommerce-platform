import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { ValidationError } from "../utils/ApiError";

const storage = multer.memoryStorage();

const ALLOWED_MIMES = new Set([
  "application/pdf",
  "text/plain",
]);

export function documentFileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  if (ALLOWED_MIMES.has(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new ValidationError("Only PDF and plain-text documents are allowed."));
}

export const uploadDocument = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
}).single("document");
