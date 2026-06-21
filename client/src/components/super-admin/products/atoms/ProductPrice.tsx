"use client";

interface ProductPriceProps {
  price: number;
  className?: string;
}

export function ProductPrice({ price, className }: ProductPriceProps) {
  return (
    <span className={className}>
      ${Number(price).toFixed(2)}
    </span>
  );
}