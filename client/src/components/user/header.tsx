"use client";

import {
  ArrowLeft,
  Menu,
  ShoppingBag,
  ShoppingCart,
  User,
  Search,
  Heart,
  Bell,
  ChevronDown,
  Globe,
  Phone,
  Mail,
  Shield,
  HelpCircle,
  Star,
  TrendingUp,
  Package,
  Bookmark,
  MapPin,
  Store,
  LogOut,
  Check,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useCartStore } from "@/store/useCartStore";
// import ThemeToggle from "../layout/Themetoggle";
import ThemeToggle from "../common/ThemeToggler";
import { Input } from "../ui/input";
import { useCategoryStore } from "@/store/useCategoryStore";

type HeaderNavItem = {
  title: string;
  to: string;
  icon: ReactNode;
  badge?: string;
  megaMenu?: boolean;
};

const mainNavItems: HeaderNavItem[] = [
  {
    title: "HOME",
    to: "/",
    icon: <TrendingUp className="h-4 w-4 mr-2" />,
  },
  {
    title: "SHOP",
    to: "/products",
    icon: <ShoppingBag className="h-4 w-4 mr-2" />,
    megaMenu: true,
  },
  {
    title: "NEW ARRIVALS",
    to: "/new-arrivals",
    icon: <Star className="h-4 w-4 mr-2" />,
    badge: "HOT",
  },
];

const accountItems = [
  { title: "My Account", to: "/account" },
  { title: "Orders", to: "/orders" },
  { title: "Wishlist", to: "/wishlist" },
  { title: "Saved Items", to: "/saved" },
  { title: "Addresses", to: "/account?tab=addresses" },
];

const accountItemVisuals: Record<
  string,
  { icon: ReactNode; helper: string }
> = {
  "My Account": {
    icon: <User className="h-4 w-4 text-primary" />,
    helper: "Profile and preferences",
  },
  Orders: {
    icon: <Package className="h-4 w-4 text-primary" />,
    helper: "Track and manage purchases",
  },
  Wishlist: {
    icon: <Heart className="h-4 w-4 text-primary" />,
    helper: "Saved favorites",
  },
  "Saved Items": {
    icon: <Bookmark className="h-4 w-4 text-primary" />,
    helper: "Items for later",
  },
  Addresses: {
    icon: <MapPin className="h-4 w-4 text-primary" />,
    helper: "Delivery locations",
  },
};

const infoItems = [
  {
    title: "Contact Us",
    to: "/contact",
    icon: <Phone className="h-4 w-4 mr-2" />,
  },
  {
    title: "Help Center",
    to: "/help",
    icon: <HelpCircle className="h-4 w-4 mr-2" />,
  },
  {
    title: "Privacy Policy",
    to: "/privacy",
    icon: <Shield className="h-4 w-4 mr-2" />,
  },
  {
    title: "Terms of Service",
    to: "/terms",
    icon: <Mail className="h-4 w-4 mr-2" />,
  },
];

const languageOptions = [
  { label: "English", value: "en" },
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
] as const;

function Header() {
  const { logout, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileView, setMobileView] = useState<
    "menu" | "account" | "categories"
  >("menu");
  const [showSheetDialog, setShowSheetDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const { fetchCart, items } = useCartStore();
  const { categories, fetchCategories } = useCategoryStore();

  const categoryItems = useMemo(() => categories, [categories]);
  const departmentOptions = useMemo(
    () =>
      categoryItems.map((category) => ({
        categoryTitle: category.title,
        subcategories: category.subcategories.map((sub) => ({
          label: sub.title,
          value: `${category.title}::${sub.title}`,
        })),
      })),
    [categoryItems],
  );

  useEffect(() => {
    if (!user) return;
    if (items.length > 0) return;
    fetchCart();
  }, [fetchCart, user, items.length]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("preferred-language");
    if (!savedLanguage) return;
    const matched = languageOptions.find((lang) => lang.value === savedLanguage);
    if (matched) {
      setSelectedLanguage(matched.label);
      document.documentElement.lang = matched.value;
    }
  }, []);

  const handleLanguageSelect = (value: (typeof languageOptions)[number]["value"]) => {
    const selected = languageOptions.find((lang) => lang.value === value);
    if (!selected) return;
    setSelectedLanguage(selected.label);
    localStorage.setItem("preferred-language", selected.value);
    document.documentElement.lang = selected.value;
  };

  useEffect(() => {
    if (pathname !== "/products") return;
    const main = searchParams.get("mainCategory")?.trim() ?? "";
    const sub = searchParams.get("subcategory")?.trim() ?? "";
    if (!main) {
      setSelectedDepartment("all");
    } else {
      setSelectedDepartment(sub ? `${main}::${sub}` : "all");
    }
    const q = searchParams.get("search") ?? "";
    setSearchQuery(q);
  }, [pathname, searchParams]);

  async function handleLogout() {
    await logout();
    router.push("/auth/login");
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());

    if (selectedDepartment !== "all") {
      const [mainCategory, subcategory] = selectedDepartment.split("::");
      if (mainCategory) params.set("mainCategory", mainCategory);
      if (subcategory) params.set("subcategory", subcategory);
    }

    const query = params.toString();
    router.push(query ? `/products?${query}` : "/products");
  };

  const handleDepartmentSelect = (value: string) => {
    setSelectedDepartment(value);
    if (pathname !== "/products") return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("mainCategory");
    params.delete("subcategory");

    if (value !== "all") {
      const [mainCategory, subcategory] = value.split("::");
      if (mainCategory) params.set("mainCategory", mainCategory);
      if (subcategory) params.set("subcategory", subcategory);
    }

    const next = params.toString();
    router.replace(next ? `/products?${next}` : "/products");
  };

  const renderMobileMenuItems = () => {
    switch (mobileView) {
      case "account":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                onClick={() => setMobileView("menu")}
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h3 className="text-lg font-semibold text-foreground">Account</h3>
            </div>

            {user ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-card rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>

                <nav className="space-y-1">
                  {accountItems.map((item) => (
                    <Button
                      key={item.title}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setShowSheetDialog(false);
                        router.push(item.to);
                      }}
                    >
                      {item.title}
                    </Button>
                  ))}
                </nav>

                <div className="pt-4 border-t border-border">
                  <ThemeToggle />
                  <Button
                    onClick={handleLogout}
                    variant="destructive"
                    className="w-full mt-3"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Sign in to access your account
                </p>
                <Button
                  onClick={() => {
                    setShowSheetDialog(false);
                    router.push("/auth/login");
                  }}
                  className="w-full"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => {
                    setShowSheetDialog(false);
                    router.push("/auth/register");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Create Account
                </Button>
              </div>
            )}
          </div>
        );

      case "categories":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                onClick={() => setMobileView("menu")}
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h3 className="text-lg font-semibold text-foreground">
                Categories
              </h3>
            </div>

            <div className="space-y-2">
              {categoryItems.map((category) => (
                <div key={category.title} className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-between"
                    onClick={() => {
                      setShowSheetDialog(false);
                      router.push(
                        `/products?mainCategory=${encodeURIComponent(category.title)}`,
                      );
                    }}
                  >
                    <span className="font-medium">{category.title}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <div className="pl-4 space-y-1">
                    {category.subcategories.map((sub) => (
                      <Button
                        key={sub.title}
                        variant="ghost"
                        className="w-full justify-start text-sm"
                        onClick={() => {
                          setShowSheetDialog(false);
                          router.push(
                            `/products?mainCategory=${encodeURIComponent(category.title)}&subcategory=${encodeURIComponent(sub.title)}`,
                          );
                        }}
                      >
                        {sub.title}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6 py-2">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-input border-border"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>

            {/* Main Navigation */}
            <div className="space-y-1">
              {mainNavItems.map((navItem) => (
                <Button
                  key={navItem.title}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setShowSheetDialog(false);
                    router.push(navItem.to);
                  }}
                >
                  <span className="flex items-center">
                    {navItem.icon}
                    {navItem.title}
                    {navItem.badge && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-accent text-accent-foreground">
                        {navItem.badge}
                      </span>
                    )}
                  </span>
                </Button>
              ))}

              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setMobileView("categories")}
              >
                <span className="flex items-center">
                  <Menu className="h-4 w-4 mr-2" />
                  All Categories
                </span>
              </Button>
            </div>

            {/* Quick Links */}
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-muted-foreground px-2">
                Information
              </h4>
              {infoItems.map((item) => (
                <Button
                  key={item.title}
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={() => {
                    setShowSheetDialog(false);
                    router.push(item.to);
                  }}
                >
                  {item.icon}
                  {item.title}
                </Button>
              ))}
            </div>

            {/* User Actions */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => setMobileView("account")}
                  variant="outline"
                  className="flex-1"
                >
                  <User className="h-4 w-4 mr-2" />
                  Account
                </Button>
                <ThemeToggle />
              </div>

              <Button
                onClick={() => {
                  setShowSheetDialog(false);
                  router.push("/cart");
                }}
                className="w-full"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Cart ({items?.length || 0})
              </Button>

              <Button
                onClick={() => {
                  setShowSheetDialog(false);
                  router.push("/wishlist");
                }}
                variant="outline"
                className="w-full"
              >
                <Heart className="h-4 w-4 mr-2" />
                Wishlist
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-glass-border backdrop-blur-sm">
      {/* Top Bar */}
      <div className="bg-primary/10 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-8 text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-primary font-medium animate-pulse">
                🚀 Free shipping on orders over $50
              </span>
              <span className="hidden md:inline text-muted-foreground">
                New collection just dropped!
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7">
                    <Globe className="h-3 w-3 mr-1" />
                    {selectedLanguage}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {languageOptions.map((language) => (
                    <DropdownMenuItem
                      key={language.value}
                      onClick={() => handleLanguageSelect(language.value)}
                      className="flex items-center justify-between gap-3"
                    >
                      {language.label}
                      {selectedLanguage === language.label && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link
                href="/contact"
                className="hidden md:inline text-sm text-muted-foreground hover:text-foreground"
              >
                Contact: support@futureshop.com
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                <span className="text-xl font-bold text-white">F</span>
              </div>
              <div className="absolute -inset-1 rounded-full bg-primary/20 animate-pulse"></div>
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                FUTURESHOP
              </span>
              <p className="text-xs text-muted-foreground">Next-Gen Commerce</p>
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="hidden lg:flex flex-1 max-w-3xl mx-8">
            <form
              onSubmit={handleSearch}
              className="relative w-full flex items-center"
            >
              <select
                value={selectedDepartment}
                onChange={(e) => handleDepartmentSelect(e.target.value)}
                className="h-10 min-w-[220px] rounded-l-full border border-border/50 border-r-0 bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">All Departments</option>
                {departmentOptions.map((group) => (
                  <optgroup key={group.categoryTitle} label={group.categoryTitle}>
                    {group.subcategories.map((sub) => (
                      <option key={sub.value} value={sub.value}>
                        {sub.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <Input
                type="search"
                placeholder="Search futuristic products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 bg-card border-border/50 focus:border-primary/50 rounded-none rounded-r-full"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-2">
            {/* Wishlist */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/wishlist")}
              className="relative rounded-full"
            >
              <Heart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/cart")}
              className="relative rounded-full"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                {items?.length || 0}
              </span>
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/notifications")}
              className="relative rounded-full"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-secondary text-secondary-foreground text-xs rounded-full flex items-center justify-center">
                5
              </span>
            </Button>

            {/* Account Dropdown */}
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-left hidden xl:block">
                        <p className="text-sm font-medium">Welcome</p>
                        <p className="text-xs text-muted-foreground">
                          {user ? user.name : "Sign In"}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-80 rounded-2xl border border-border bg-card text-card-foreground shadow-2xl backdrop-blur-none"
                >
                  {user ? (
                    <>
                      <div className="rounded-t-2xl border-b border-border bg-muted/40 px-4 py-4">
                        <p className="text-base font-semibold text-foreground">
                          {user.name}
                        </p>
                        <p className="text-sm text-muted-foreground break-all">
                          {user.email}
                        </p>
                      </div>
                      <div className="px-2 pb-2 pt-2">
                        <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Account
                        </p>
                      {accountItems.map((item) => (
                        <DropdownMenuItem
                          key={item.title}
                          onClick={() => router.push(item.to)}
                          className="mx-1 my-1 rounded-lg px-3 py-2.5 focus:bg-accent/20"
                        >
                          <div className="flex w-full items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                                {accountItemVisuals[item.title]?.icon ?? (
                                  <User className="h-4 w-4 text-primary" />
                                )}
                              </span>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground">
                                  {item.title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {accountItemVisuals[item.title]?.helper ?? "Open section"}
                                </span>
                              </div>
                            </div>
                            <ChevronDown className="h-3 w-3 -rotate-90 text-muted-foreground" />
                          </div>
                        </DropdownMenuItem>
                      ))}
                      </div>
                      {user.role === "SELLER" && (
                        <DropdownMenuItem
                          onClick={() => router.push("/seller")}
                          className="mx-3 my-1 rounded-lg px-3 py-2.5 focus:bg-accent/20"
                        >
                          <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-secondary/15">
                            <Store className="h-4 w-4 text-secondary" />
                          </span>
                          <span className="font-medium">Seller dashboard</span>
                        </DropdownMenuItem>
                      )}
                      {user.role === "USER" && (
                        <DropdownMenuItem
                          onClick={() => router.push("/seller/register")}
                          className="mx-3 my-1 rounded-lg px-3 py-2.5 focus:bg-accent/20"
                        >
                          <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-secondary/15">
                            <Store className="h-4 w-4 text-secondary" />
                          </span>
                          <span className="font-medium">Become a seller</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <div className="px-3 py-2">
                        <ThemeToggle />
                      </div>
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="mx-2 mb-2 rounded-lg px-3 py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-destructive/15">
                          <LogOut className="h-4 w-4 text-destructive" />
                        </span>
                        <span className="font-medium">Logout</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem
                        onClick={() => router.push("/auth/login")}
                        className="mx-2 mt-2 rounded-lg px-3 py-2.5 focus:bg-accent/20"
                      >
                        Sign In
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push("/auth/register")}
                        className="mx-2 my-1 rounded-lg px-3 py-2.5 focus:bg-accent/20"
                      >
                        Create Account
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {infoItems.map((item) => (
                        <DropdownMenuItem
                          key={item.title}
                          onClick={() => router.push(item.to)}
                          className="mx-2 my-1 rounded-lg px-3 py-2.5 focus:bg-accent/20"
                        >
                          <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                            {item.icon}
                          </span>
                          {item.title}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Theme Toggle - Desktop */}
            <div className="hidden xl:block">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/cart")}
              className="relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {items?.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Button>
            <Sheet open={showSheetDialog} onOpenChange={setShowSheetDialog}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:w-96">
                <SheetHeader>
                  <SheetTitle className="flex items-center">
                    <Link href="/" onClick={() => setShowSheetDialog(false)}>
                      <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent text-xl font-bold">
                        FUTURESHOP
                      </span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                {renderMobileMenuItems()}
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center justify-between py-3">
          <nav className="flex items-center space-x-6">
            {mainNavItems.map((item) => (
              <div key={item.title} className="relative group">
                <Link
                  href={item.to}
                  className="flex items-center text-sm font-medium hover:text-primary transition-colors"
                >
                  {item.icon}
                  {item.title}
                  {item.badge && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-accent text-accent-foreground">
                      {item.badge}
                    </span>
                  )}
                  {item.megaMenu && <ChevronDown className="ml-1 h-3 w-3" />}
                </Link>

                {/* Mega Menu for Shop */}
                {item.megaMenu && (
                  <div className="absolute top-full left-0 w-screen max-w-4xl bg-card border border-border shadow-2xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-6">
                    <div className="grid grid-cols-4 gap-6">
                      {categoryItems.map((category) => (
                        <div key={category.title} className="space-y-2">
                          <h4 className="font-semibold text-foreground mb-2">
                            {category.title}
                          </h4>
                          <ul className="space-y-1">
                            {category.subcategories.map((sub) => (
                              <li key={sub.title}>
                                <Link
                                  href={`/products?mainCategory=${encodeURIComponent(category.title)}&subcategory=${encodeURIComponent(sub.title)}`}
                                  className="text-sm text-muted-foreground hover:text-primary"
                                >
                                  {sub.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center space-x-4 text-sm">
            <Link
              href="/help"
              className="text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="h-4 w-4 inline mr-1" />
              Help
            </Link>
            <Link
              href="/track-order"
              className="text-muted-foreground hover:text-foreground"
            >
              Track Order
            </Link>
            <span className="text-primary font-medium">
              24/7 Support: 1-800-FUTURE
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
