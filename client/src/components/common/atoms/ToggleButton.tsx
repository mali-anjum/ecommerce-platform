"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ToggleButtonProps {
  isOpen: boolean;
  toggle: () => void;
}

export function ToggleButton({ isOpen, toggle }: ToggleButtonProps) {
  return (
    <div className="absolute -right-3 top-6 z-10">
      <Button
        variant="default"
        size="icon"
        className={cn(
          "h-6 w-6 rounded-full shadow-lg transition-all duration-300",
          "bg-linear-to-r from-primary to-secondary hover:from-primary-light hover:to-secondary-light"
        )}
        onClick={toggle}
      >
        {isOpen ? (
          <ChevronLeft className="h-3 w-3 text-primary-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-primary-foreground" />
        )}
      </Button>
    </div>
  );
}