"use client";

import { TableCell, TableRow } from "@/components/ui/table";

interface ProductEmptyStateProps {
  text: string;
}

export function ProductEmptyState({ text }: ProductEmptyStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
        {text}
      </TableCell>
    </TableRow>
  );
}