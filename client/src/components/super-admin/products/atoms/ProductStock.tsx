"use client";

interface ProductStockProps {
  stock: number;
  className?: string;
}

export function ProductStock({ stock, className }: ProductStockProps) {
  return (
    <span className={className}>
      {stock ?? 0}
    </span>
  );
}