"use client";

import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

interface LogoProps {
  isOpen: boolean;
}

export function Logo({ isOpen }: LogoProps) {
  return (
    <div className="flex items-center justify-center gap-3 p-4">
      <div className="relative">
        <div className="h-12 w-12 rounded-xl bg-linear-to-br from-primary via-secondary to-accent flex items-center justify-center">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div className="absolute -inset-1 rounded-xl bg-primary/20 animate-pulse -z-10"></div>
      </div>
      
      {isOpen && (
        <div className="space-y-1">
          <h1 className="text-xl font-bold bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
            NEXUS CONTROL
          </h1>
          <p className="text-xs text-muted-foreground">Admin Dashboard</p>
        </div>
      )}
    </div>
  );
}