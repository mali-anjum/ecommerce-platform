"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  sizes?: string;
}

export function ProductImage({ src, alt, className, sizes = "48px" }: ProductImageProps) {
  return (
    <div className={cn("relative h-12 w-12 overflow-hidden rounded-md bg-muted", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={sizes}
        />
      ) : null}
    </div>
  );
}