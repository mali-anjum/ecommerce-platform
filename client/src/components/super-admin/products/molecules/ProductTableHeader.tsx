"use client";

import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ProductTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Product</TableHead>
        <TableHead>Price</TableHead>
        <TableHead>Stock</TableHead>
        <TableHead>Category</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}