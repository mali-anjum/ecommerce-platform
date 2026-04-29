"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, CheckCheck, Package, Tag, ShieldAlert, Clock3 } from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: "order" | "offer" | "security";
  read: boolean;
  time: string;
};

const initialNotifications: NotificationItem[] = [
  {
    id: "n-1",
    title: "Order shipped",
    message: "Your order #FS-1029 has been shipped and is on the way.",
    type: "order",
    read: false,
    time: "2h ago",
  },
  {
    id: "n-2",
    title: "Limited time offer",
    message: "Get 15% off on Electronics today. Use code FUTURE15.",
    type: "offer",
    read: false,
    time: "5h ago",
  },
  {
    id: "n-3",
    title: "Security alert",
    message: "New login detected from Chrome on Linux.",
    type: "security",
    read: true,
    time: "1d ago",
  },
];

function getTypeIcon(type: NotificationItem["type"]) {
  if (type === "order") return <Package className="h-4 w-4 text-primary" />;
  if (type === "offer") return <Tag className="h-4 w-4 text-secondary" />;
  return <ShieldAlert className="h-4 w-4 text-accent" />;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !user) {
      router.push("/auth/login");
    }
  }, [isMounted, router, user]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const markAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, read: !item.read } : item,
      ),
    );
  };

  if (!isMounted || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card/30 py-8">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-8 rounded-2xl border border-glass-border glass-effect p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
                <p className="text-muted-foreground">
                  Stay updated with orders, offers, and account alerts.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary text-primary">
                {unreadCount} unread
              </Badge>
              <Button variant="outline" onClick={markAllRead}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all as read
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {notifications.map((item) => (
            <Card
              key={item.id}
              className={`border-border/70 bg-card/95 transition-all ${
                item.read ? "opacity-85" : "border-primary/50"
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5">{getTypeIcon(item.type)}</div>
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <h2 className="font-semibold text-foreground">{item.title}</h2>
                        {!item.read && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.message}</p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3 className="h-3 w-3" />
                        {item.time}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleRead(item.id)}
                  >
                    {item.read ? "Mark unread" : "Mark read"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
