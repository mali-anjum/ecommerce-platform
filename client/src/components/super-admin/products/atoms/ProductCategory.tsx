"use client";

interface ProductCategoryProps {
  category?: string;
  className?: string;
}

export function ProductCategory({ category, className }: ProductCategoryProps) {
  return (
    <span className={className}>
      {category || "Uncategorized"}
    </span>
  );
}