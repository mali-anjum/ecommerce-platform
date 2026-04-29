"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ShoppingCart, Trash2, Sparkles } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

type WishlistItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
};

const demoWishlistItems: WishlistItem[] = [
  {
    id: "wl-1",
    name: "Quantum Noise-Canceling Headphones",
    price: 249.99,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    category: "Electronics",
  },
  {
    id: "wl-2",
    name: "Neo Smart Lighting Set",
    price: 89.0,
    image:
      "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80",
    category: "Home & Living",
  },
  {
    id: "wl-3",
    name: "Aero Streetwear Jacket",
    price: 129.5,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
    category: "Fashion",
  },
];

export default function WishlistPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [items, setItems] = useState<WishlistItem[]>(demoWishlistItems);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !user) {
      router.push("/auth/login");
    }
  }, [isMounted, router, user]);

  const totalValue = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items],
  );

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  if (!isMounted || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card/30 py-8">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-8 rounded-2xl border border-glass-border glass-effect p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">My Wishlist</h1>
                <p className="text-muted-foreground">
                  Save favorites and move them to cart anytime.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary text-primary">
                <Sparkles className="mr-1 h-3 w-3" />
                {items.length} saved
              </Badge>
              <Badge variant="outline" className="border-border">
                ${totalValue.toFixed(2)} total
              </Badge>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <Card className="border-border/70 bg-card/95">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <Heart className="h-10 w-10 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Your wishlist is empty</h2>
              <p className="text-muted-foreground">
                Browse products and save items you want later.
              </p>
              <Button onClick={() => router.push("/products")}>Explore products</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden border-border/70 bg-card/95 shadow-lg transition-all hover:border-primary/50"
              >
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <CardContent className="space-y-4 p-4">
                  <Badge variant="outline" className="border-border">
                    {item.category}
                  </Badge>
                  <h3 className="line-clamp-2 text-base font-semibold text-foreground">
                    {item.name}
                  </h3>
                  <p className="text-lg font-bold text-primary">${item.price.toFixed(2)}</p>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => router.push(`/products/${item.id}`)}
                    >
                      View item
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/cart")}>
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
