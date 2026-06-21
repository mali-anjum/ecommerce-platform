"use client";

interface ProductNameProps {
  name: string;
  id: string;
}

export function ProductName({ name, id }: ProductNameProps) {
  return (
    <div>
      <p className="font-medium">{name}</p>
      <p className="text-xs text-muted-foreground">
        ID: {id.slice(0, 8)}
      </p>
    </div>
  );
}