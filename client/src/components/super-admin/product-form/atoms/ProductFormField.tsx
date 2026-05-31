"use client";

import { Label } from "@/components/ui/label";
import type { ReactNode } from "react";

interface ProductFormFieldProps {
  label: string;
  name: string;
  icon: ReactNode;
  children: ReactNode;
  error?: string;
}

export function ProductFormField({
  label,
  name,
  icon,
  children,
  error,
}: ProductFormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="flex items-center gap-2">
        {icon}
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
