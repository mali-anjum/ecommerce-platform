"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

interface ProductManagementHeaderProps {
  title: string;
  subtitle: string;
  addHref: string;
}

export function ProductManagementHeader({ 
  title, 
  subtitle, 
  addHref 
}: ProductManagementHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Button asChild>
        <Link href={addHref}>
          <Plus className="h-4 w-4 mr-2" />
          Add product
        </Link>
      </Button>
    </div>
  );
}