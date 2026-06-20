"use client";

import { Label } from "@/components/ui/label";
import { Sparkles, Upload, X, Zap } from "lucide-react";
import Image from "next/image";
import type { ChangeEvent, DragEvent } from "react";
import { useEffect, useMemo, useState } from "react";

interface ProductFormFileUploadProps {
  selectedFiles: File[];
  /** Called with files from the picker or drag-and-drop; parent should merge with existing. */
  onFilesAdded: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  isEditMode: boolean;
}

function fileFingerprint(file: File): string {
  return `${file.name}\0${file.size}\0${file.lastModified}`;
}

export function ProductFormFileUpload({
  selectedFiles,
  onFilesAdded,
  onRemoveFile,
  isEditMode,
}: ProductFormFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const previews = useMemo(
    () =>
      selectedFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [selectedFiles]
  );

  useEffect(() => {
    return () => {
      previews.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (list?.length) {
      onFilesAdded(Array.from(list));
    }
    e.target.value = "";
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const related = e.relatedTarget as Node | null;
    if (e.currentTarget.contains(related)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dt = e.dataTransfer.files;
    if (!dt?.length) return;
    const imageFiles = Array.from(dt).filter((f) =>
      f.type.startsWith("image/")
    );
    if (imageFiles.length) {
      onFilesAdded(imageFiles);
    }
  };

  if (isEditMode) return null;

  return (
    <div className="glass-effect rounded-2xl p-8 border border-glass-border">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="h-20 w-20 rounded-full bg-linear-to-r from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
            <Upload className="h-10 w-10 text-primary" />
          </div>
          <div className="absolute -inset-2 rounded-full bg-primary/10 animate-pulse"></div>
        </div>

        <h3 className="text-xl font-bold text-foreground mb-2">
          Upload Product Images
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Choose several images in one dialog (Ctrl/Cmd + click), add more in
          another batch, or drag and drop multiple files together.
        </p>

        <Label htmlFor="product-form-images" className="cursor-pointer block">
          <div
            className={`border-2 border-dashed rounded-xl p-8 transition-colors hover:bg-primary/5 ${
              isDragging
                ? "border-primary bg-primary/10 scale-[1.01]"
                : "border-border hover:border-primary"
            }`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="font-medium text-foreground">
                Drop images here or click to browse
              </span>
              <span className="text-sm text-muted-foreground">
                Multi-select supported · PNG, JPG, WEBP up to 10MB
              </span>
            </div>
          </div>
          <input
            id="product-form-images"
            type="file"
            className="sr-only"
            multiple
            accept="image/*"
            onChange={handleInputChange}
          />
        </Label>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-8">
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-secondary" />
            Selected Images ({selectedFiles.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map(({ file, url }, index) => (
              <div
                key={`${fileFingerprint(file)}-${index}`}
                className="relative group overflow-hidden rounded-lg border border-border"
              >
                <button
                  type="button"
                  onClick={() => onRemoveFile(index)}
                  className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md border border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
                <Image
                  src={url}
                  alt={`Preview ${index + 1}`}
                  width={120}
                  height={120}
                  unoptimized
                  className="h-32 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 pt-8 pointer-events-none select-none">
                  <span className="text-white text-xs truncate">{file.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
