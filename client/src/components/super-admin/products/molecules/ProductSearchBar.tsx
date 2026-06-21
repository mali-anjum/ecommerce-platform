"use client";

import { Input } from "@/components/ui/input";

interface ProductSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ProductSearchBar({ 
  value, 
  onChange, 
  placeholder = "Search by product or category" 
}: ProductSearchBarProps) {
  return (
    <div className="max-w-md">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}