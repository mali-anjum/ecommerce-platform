
"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  LogOut,
  Package,
  Printer,
  SendToBack,
  Settings,
  LayoutDashboard,
  Users,
  Shield,
  Zap,
  Sparkles,
  Globe,
  Database,
  Bell,
  CreditCard,
  Layers,
  ShoppingCart,
  Tag,
  Gift,
  Settings as SettingsIcon,
  User,
  Palette,
  Bell as BellIcon,
  Database as DatabaseIcon,
  Globe as GlobeIcon,
  Zap as ZapIcon,
  TrendingUp,
  Bot,
  MessageSquareWarning,
  HelpCircle,
  BookOpen,
  UserPlus,
  FileText,
  BarChart3,
  Headphones,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/components/auth/state/useAuthStore";
import { isModuleEnabled } from "@/lib/feature-flags";
import { useEffect, useMemo, useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

// ==================== MODULAR COMPONENTS ====================

// 1. Menu Item Component
interface MenuItemProps {
  name: string;
  icon: React.ElementType;
  href: string;
  isOpen: boolean;
  isActive: boolean;
  badge?: string;
  onClick: () => void;
}

function MenuItem({ 
  name, 
  icon: Icon, 
  href, 
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

// 2. Section Header Component
interface SectionHeaderProps {
  title: string;
  isOpen: boolean;
  icon?: React.ElementType;
}

function SectionHeader({ title, isOpen, icon: Icon }: SectionHeaderProps) {
  if (!isOpen && !Icon) return null;
  
  return (
    <div className="px-4 py-2">
      {isOpen ? (
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
        </div>
      ) : Icon ? (
        <div className="flex justify-center py-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

// 3. Logo Component
interface LogoProps {
  isOpen: boolean;
}

function Logo({ isOpen }: LogoProps) {
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

// ==================== MAIN COMPONENT ====================

type MenuItemConfig = {
  name: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
};

type MenuSectionConfig = {
  title: string;
  icon: React.ElementType;
  items: MenuItemConfig[];
  requiresAi?: boolean;
};

const menuSections: MenuSectionConfig[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    items: [
      {
        name: "Overview",
        icon: BarChart3,
        href: "/super-admin",
        badge: "NEW",
      },
      {
        name: "Sales",
        icon: TrendingUp,
        href: "/super-admin/analytics/sales",
      },
      {
        name: "Products",
        icon: Package,
        href: "/super-admin/analytics/products",
      },
      {
        name: "Customers",
        icon: User,
        href: "/super-admin/analytics/customers",
      },
      {
        name: "Marketing",
        icon: Tag,
        href: "/super-admin/analytics/marketing",
      },
      {
        name: "Operations",
        icon: SendToBack,
        href: "/super-admin/analytics/operations",
      },
      {
        name: "Global",
        icon: Globe,
        href: "/super-admin/analytics/global",
      },
    ],
  },
  {
    title: "Products",
    icon: Package,
    items: [
      {
        name: "Products",
        icon: Package,
        href: "/super-admin/products/list",
        badge: "12",
      },
      {
        name: "Add Product",
        icon: Zap,
        href: "/super-admin/products/add",
      },
      {
        name: "Categories",
        icon: Layers,
        href: "/super-admin/categories",
      },
      {
        name: "Inventory",
        icon: Database,
        href: "/super-admin/inventory",
      },
    ],
  },
  {
    title: "Sales",
    icon: ShoppingCart,
    items: [
      {
        name: "Orders",
        icon: SendToBack,
        href: "/super-admin/orders",
        badge: "3",
      },
      {
        name: "Transactions",
        icon: CreditCard,
        href: "/super-admin/transactions",
      },
      {
        name: "Coupons",
        icon: Tag,
        href: "/super-admin/coupons/list",
      },
      {
        name: "Create Coupon",
        icon: Gift,
        href: "/super-admin/coupons/add",
      },
    ],
  },
  {
    title: "Management",
    icon: Users,
    items: [
      {
        name: "Users",
        icon: User,
        href: "/super-admin/users",
      },
      {
        name: "Leads",
        icon: UserPlus,
        href: "/super-admin/leads",
      },
      {
        name: "Admins",
        icon: Shield,
        href: "/super-admin/admins",
      },
    ],
  },
  {
    title: "AI Operations",
    icon: Bot,
    requiresAi: true,
    items: [
      {
        name: "Knowledge",
        icon: BookOpen,
        href: "/super-admin/ai/knowledge",
      },
      {
        name: "Sales agent",
        icon: Sparkles,
        href: "/super-admin/ai/sales-agent",
      },
      {
        name: "Review analyzer",
        icon: MessageSquareWarning,
        href: "/super-admin/ai/review-analyzer",
      },
      {
        name: "Analytics",
        icon: BarChart3,
        href: "/super-admin/ai/analytics",
      },
      {
        name: "Support tickets",
        icon: Headphones,
        href: "/super-admin/ai/support-tickets",
      },
    ],
  },
  {
    title: "Settings",
    icon: SettingsIcon,
    items: [
      {
        name: "Settings",
        icon: Settings,
        href: "/super-admin/settings",
      },
      {
        name: "Themes",
        icon: Palette,
        href: "/super-admin/themes",
      },
      {
        name: "Notifications",
        icon: Bell,
        href: "/super-admin/notifications",
      },
      {
        name: "Logout",
        icon: LogOut,
        href: "#logout",
      },
    ],
  },
];

function SuperAdminSidebar({ isOpen, toggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState<string>("");
  const aiEnabled = isModuleEnabled("ai");

  const visibleSections = useMemo(() => {
    return menuSections.filter(
      (section) => !section.requiresAi || aiEnabled,
    );
  }, [aiEnabled]);

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

  const handleItemClick = async (item: { name: string; href: string }) => {
    if (item.name === "Logout") {
      await logout();
      router.push("/auth/login");
    } else if (item.href) {
      router.push(item.href);
    }
  };

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
          
          {/* Toggle Button */}
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
            <div key={section.title} className="mb-6">
              <SectionHeader 
                title={section.title} 
                isOpen={isOpen} 
                icon={section.icon}
              />
              
              <div className="space-y-1">
                {section.items.map((item) => {
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
                      onClick={() => handleItemClick(item)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
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
      </div>

      {/* Sidebar Glow Effect */}
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-primary/5 via-transparent to-secondary/5 opacity-50"></div>
    </div>
  );
}

export default SuperAdminSidebar;