"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Floating action button — scrolls to top of the listing page. */
export function ProductsBackToTopFab() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="glass-effect fixed bottom-8 right-8 z-50 h-12 w-12 rounded-full border-glass-border shadow-lg"
            size="icon"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <Sparkles className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Back to top</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
