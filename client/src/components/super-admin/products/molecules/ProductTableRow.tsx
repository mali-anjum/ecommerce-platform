"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { ProductImage } from "../atoms/ProductImage";
import { ProductName } from "../atoms/ProductName";
import { ProductPrice } from "../atoms/ProductPrice";
import { ProductStock } from "../atoms/ProductStock";
import { ProductCategory } from "../atoms/ProductCategory";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
  images?: string[];
}

interface ProductTableRowProps {
  product: Product;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProductTableRow({ product, onEdit, onDelete }: ProductTableRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <ProductImage src={product.images?.[0]} alt={product.name} />
          <ProductName name={product.name} id={product.id} />
        </div>
      </TableCell>
      <TableCell>
        <ProductPrice price={product.price} />
      </TableCell>
      <TableCell>
        <ProductStock stock={product.stock} />
      </TableCell>
      <TableCell>
        <ProductCategory category={product.category} />
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(product.id)}
          aria-label="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(product.id)}
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
}