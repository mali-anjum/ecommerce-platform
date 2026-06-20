import {
    ListOrdered,
    LogOut,
    Package,
    SendToBack,
    Settings,
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
    HelpCircle,
    BookOpen,
    UserPlus,
    FileText,
    BarChart3,
    Headphones,
    BarChart2,
    SquareChartGantt,
    ChartSpline,
  } from "lucide-react";
  
  export interface MenuItemConfig {
    name: string;
    icon: React.ElementType;
    href: string;
    badge?: string;
  }
  
  export interface MenuSectionConfig {
    title: string;
    icon: React.ElementType;
    items: MenuItemConfig[];
    requiresAi?: boolean;
  }
  
  export const menuSections: MenuSectionConfig[] = [
    {
      title: "Analytics",
      icon: ChartSpline,
      items: [
        {
          name: "Overview",
          icon: SquareChartGantt,
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
          href: "/super-admin/products/categories",
        },
        {
          name: "Inventory",
          icon: Database,
          href: "/super-admin/products/inventory",
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