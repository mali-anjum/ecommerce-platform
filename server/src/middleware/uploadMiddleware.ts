// src/middleware/uploadMiddleware.ts
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { ValidationError } from '../utils/ApiError';

const storage = multer.memoryStorage();

// SVG is excluded on purpose: it can embed scripts.
export const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

export const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    // ValidationError maps to 400 in the error handler (a plain Error became a 500).
    cb(new ValidationError('Only JPEG, PNG, WebP, GIF or AVIF images are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
    files: 10
  },
});

// Export specific upload configurations
export const uploadSingle = upload.single('image');
export const uploadMultiple = upload.array('images', 5); // ← Use this
export const uploadFields = upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 4 }
]);

export { upload };