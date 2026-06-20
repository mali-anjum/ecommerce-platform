"use client";

import { cn } from "@/lib/utils";

interface MenuItemProps {
  name: string;
  icon: React.ElementType;
  href: string;
  isOpen: boolean;
  isActive: boolean;
  badge?: string;
  onClick: () => void;
}

export function MenuItem({ 
  name, 
  icon: Icon, 
  isOpen, 
  isActive, 
  badge,
  onClick 
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center px-4 py-3 text-sm transition-all duration-300",
        "hover:bg-primary/10 hover:border-l-2 hover:border-l-primary",
        "rounded-lg mx-2 my-1",
        isActive 
          ? "bg-primary/10 border-l-2 border-l-primary text-primary" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {/* Icon with gradient background */}
      <div className={cn(
        "relative flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-300",
        isActive 
          ? "bg-linear-to-br from-primary to-secondary" 
          : "bg-card group-hover:bg-primary/10"
      )}>
        <Icon className={cn(
          "h-5 w-5 transition-all duration-300",
          isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
        )} />
        
        {/* Active indicator */}
        {isActive && (
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary animate-pulse"></div>
        )}
      </div>
      
      {/* Text with animation */}
      <span className={cn(
        "ml-3 font-medium transition-all duration-300 whitespace-nowrap",
        !isOpen && "opacity-0 w-0 ml-0",
        isOpen && "opacity-100"
      )}>
        {name}
      </span>
      
      {/* Badge */}
      {badge && isOpen && (
        <span className="ml-auto px-2 py-1 text-xs rounded-full bg-accent text-accent-foreground font-semibold">
          {badge}
        </span>
      )}
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-lg bg-linear-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
    </button>
  );
}