"use client";

import { Table, TableBody } from "@/components/ui/table";
import { ProductTableHeader } from "../molecules/ProductTableHeader";
import { ProductTableRow } from "../molecules/ProductTableRow";
import { ProductEmptyState } from "../molecules/ProductEmptyState";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
  images?: string[];
}

interface ProductTableProps {
  products: Product[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  emptyStateText: string;
}

export function ProductTable({ 
  products, 
  onEdit, 
  onDelete, 
  emptyStateText 
}: ProductTableProps) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <ProductTableHeader />
        <TableBody>
          {products.length === 0 ? (
            <ProductEmptyState text={emptyStateText} />
          ) : (
            products.map((product) => (
              <ProductTableRow
                key={product.id}
                product={product}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}