"use client";

import { cn } from "@/lib/utils";

interface ProductFormErrorDisplayProps {
  error: string | null;
  className?: string;
}

export function ProductFormErrorDisplay({ 
  error, 
  className 
}: ProductFormErrorDisplayProps) {
  if (!error) return null;
  
  return (
    <div className={cn(
      "p-3 bg-destructive/10 border border-destructive/20 rounded-lg",
      className
    )}>
      <p className="text-destructive text-sm">{error}</p>
    </div>
  );
}