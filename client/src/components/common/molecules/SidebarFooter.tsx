"use client";

import { cn } from "@/lib/utils";
import { Sparkles, Globe } from "lucide-react";

interface SidebarFooterProps {
  isOpen: boolean;
}

export function SidebarFooter({ isOpen }: SidebarFooterProps) {
  return (
    <div
      className={cn(
        "border-t border-glass-border p-4 pb-6 mt-auto shrink-0",
        !isOpen && "p-2 pb-4"
      )}
    >
      {isOpen ? (
        <div className="space-y-3">
          <div className="rounded-lg bg-linear-to-r from-primary/10 to-secondary/10 p-3 border border-glass-border/60">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-linear-to-r from-primary to-secondary flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Pro Plan</p>
                <p className="text-xs text-muted-foreground">All features unlocked</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>v2.4.1</span>
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Online
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-3">
          <div className="h-10 w-10 rounded-full bg-linear-to-r from-primary to-secondary flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="h-2 w-10 rounded-full bg-linear-to-r from-primary to-secondary"></div>
        </div>
      )}
    </div>
  );
}