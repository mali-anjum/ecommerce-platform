"use client";

import { cn } from "@/lib/utils";

interface ProductFormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ProductFormSection({ 
  title, 
  description, 
  children,
  className,
  contentClassName 
}: ProductFormSectionProps) {
  return (
    <div className={cn(
      "rounded-xl border border-border/60 bg-card/50 p-5 space-y-4",
      className
    )}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-semibold text-foreground">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      <div className={contentClassName}>
        {children}
      </div>
    </div>
  );
}