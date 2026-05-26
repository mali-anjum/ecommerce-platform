"use client";

import type { LucideIcon } from "lucide-react";
import {
  CheckCircle,
  Clock,
  CreditCard,
  Package,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Order } from "@/types/order/orderTypes";
import {
  getOrderDisplayStatus,
  getOrderStatusBadgeClassName,
  isOrderTerminalFailure,
} from "@/components/orders/orderFilters";
import { cn } from "@/lib/utils";

const STATUS_ICONS: Partial<Record<Order["status"], LucideIcon>> = {
  CANCELLED: XCircle,
  PAYMENT_FAILED: XCircle,
  CAPTURE_FAILED: XCircle,
  DELIVERED: CheckCircle,
  SHIPPED: Truck,
  PAYMENT_APPROVED: CheckCircle,
  PROCESSING: RefreshCw,
  PENDING_PAYMENT: CreditCard,
  PENDING: Clock,
  DRAFT: Clock,
};

type OrderStatusBadgeProps = {
  status: Order["status"];
  className?: string;
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const Icon = STATUS_ICONS[status] ?? Package;
  const label = getOrderDisplayStatus(status);
  const emphasis = isOrderTerminalFailure(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 gap-1 font-medium",
        getOrderStatusBadgeClassName(status),
        emphasis && "ring-1 ring-destructive/20",
        className
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </Badge>
  );
}
