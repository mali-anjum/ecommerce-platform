"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type MobileSheetBackHeaderProps = {
  title: string;
  onBack: () => void;
};

/** Back button + title for nested mobile sheet views (account, categories). */
export function MobileSheetBackHeader({ title, onBack }: MobileSheetBackHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <Button onClick={onBack} variant="ghost" size="icon" className="rounded-full">
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    </div>
  );
}
