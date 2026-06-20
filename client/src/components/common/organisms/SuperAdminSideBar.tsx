"use client";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/common/atoms/Logo";
import { ToggleButton } from "@/components/common/atoms/ToggleButton";
import { MenuSection } from "@/components/common/molecules/MenuSection";
import { SidebarFooter } from "@/components/common/molecules/SidebarFooter";
import { useSidebarNavigation } from "@/components/common/hooks/useSideBarNavigation";
import { menuSections } from "@/components/common/lib/sidebar-config";
import { isModuleEnabled } from "@/lib/feature-flags";
import { useMemo } from "react";

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

export function SuperAdminSidebar({ isOpen, toggle }: SidebarProps) {
  const aiEnabled = isModuleEnabled("ai");

  // Filter sections based on feature flags
  const visibleSections = useMemo(() => {
    return menuSections.filter(
      (section) => !section.requiresAi || aiEnabled,
    );
  }, [aiEnabled]);

  // Use custom hook for navigation logic
  const { pathname, handleItemClick } = useSidebarNavigation({
    visibleSections,
  });

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-50 h-screen transition-all duration-500 ease-in-out",
        "glass-effect border-r border-glass-border backdrop-blur-xs",
        isOpen ? "w-72" : "w-20",
        "shadow-xl shadow-primary/5"
      )}
    >
      {/* Sidebar Content */}
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b border-glass-border">
          <Logo isOpen={isOpen} />
          <ToggleButton isOpen={isOpen} toggle={toggle} />
        </div>

        {/* Navigation Sections */}
        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto py-4",
            "scrollbar-thin",
            "[scrollbar-color:hsl(var(--primary)/0.35)_transparent]",
            "[&::-webkit-scrollbar]:w-1.5",
            "[&::-webkit-scrollbar-thumb]:rounded-full",
            "[&::-webkit-scrollbar-thumb]:bg-primary/30",
            "[&::-webkit-scrollbar-track]:bg-transparent"
          )}
        >
          {visibleSections.map((section) => (
            <MenuSection
              key={section.title}
              title={section.title}
              icon={section.icon}
              items={section.items}
              isOpen={isOpen}
              pathname={pathname}
              onItemClick={handleItemClick}
            />
          ))}
        </div>

        {/* Footer */}
        <SidebarFooter isOpen={isOpen} />
      </div>

      {/* Sidebar Glow Effect */}
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-primary/5 via-transparent to-secondary/5 opacity-50"></div>
    </div>
  );
}

export default SuperAdminSidebar;