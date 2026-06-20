"use client";

import { ProductFormFileUpload } from "@/components/super-admin/products/atoms/ProductFormFileUpload";

interface ProductFormImageUploaderProps {
  selectedFiles: File[];
  onFilesAdded: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  isEditMode: boolean;
}

export function ProductFormImageUploader({ 
  selectedFiles, 
  onFilesAdded, 
  onRemoveFile, 
  isEditMode 
}: ProductFormImageUploaderProps) {
  return (
    <ProductFormFileUpload
      selectedFiles={selectedFiles}
      onFilesAdded={onFilesAdded}
      onRemoveFile={onRemoveFile}
      isEditMode={isEditMode}
    />
  );
}