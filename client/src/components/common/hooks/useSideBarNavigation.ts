"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/components/auth/state/useAuthStore";
import { useState, useEffect } from "react";
import { MenuItemConfig } from "@/components/common/molecules/MenuSection";

interface UseSidebarNavigationProps {
  visibleSections: Array<{
    title: string;
    items: MenuItemConfig[];
  }>;
}

export function useSidebarNavigation({ visibleSections }: UseSidebarNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState<string>("");

  // Determine active section based on pathname
  useEffect(() => {
    const section = visibleSections.find((sectionItem) =>
      sectionItem.items.some((item) =>
        item.href === "/super-admin"
          ? pathname === "/super-admin" ||
            pathname.startsWith("/super-admin/analytics")
          : pathname === item.href || pathname.startsWith(`${item.href}/`),
      ),
    );
    setActiveSection(section?.title || "");
  }, [pathname, visibleSections]);

  const handleItemClick = async (item: MenuItemConfig) => {
    if (item.name === "Logout") {
      await logout();
      router.push("/auth/login");
    } else if (item.href) {
      router.push(item.href);
    }
  };

  return {
    activeSection,
    handleItemClick,
    pathname,
    router,
  };
}