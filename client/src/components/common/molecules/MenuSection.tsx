"use client";

import { MenuItem } from "@/components/common/atoms/MenuItems"
import { SectionHeader } from "@/components/common/atoms/SectionHeader";

export interface MenuItemConfig {
  name: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
}

interface MenuSectionProps {
  title: string;
  icon: React.ElementType;
  items: MenuItemConfig[];
  isOpen: boolean;
  pathname: string;
  onItemClick: (item: MenuItemConfig) => void;
}

export function MenuSection({ 
  title, 
  icon, 
  items, 
  isOpen, 
  pathname,
  onItemClick 
}: MenuSectionProps) {
  return (
    <div className="mb-6">
      <SectionHeader title={title} isOpen={isOpen} icon={icon} />
      
      <div className="space-y-1">
        {items.map((item) => {
          const isActive =
            item.href === "/super-admin"
              ? pathname === "/super-admin" ||
                pathname.startsWith("/super-admin/analytics")
              : pathname === item.href ||
                pathname.startsWith(item.href + "/");
          
          return (
            <MenuItem
              key={item.name}
              name={item.name}
              icon={item.icon}
              href={item.href}
              isOpen={isOpen}
              isActive={isActive}
              badge={item.badge}
              onClick={() => onItemClick(item)}
            />
          );
        })}
      </div>
    </div>
  );
}