import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export type PrepareGetOrderByIdQueryParams = {
  orderId: string;
  userId: string;
  userRole: string | undefined;
};

export type PrepareGetOrderByIdQuerySuccess = {
  ok: true;
  where: Prisma.OrderWhereInput;
  include: Prisma.OrderInclude;
};

export type PrepareGetOrderByIdQueryFailure = {
  ok: false;
  code: "SELLER_PROFILE_NOT_FOUND";
};

export type PrepareGetOrderByIdQueryResult =
  | PrepareGetOrderByIdQuerySuccess
  | PrepareGetOrderByIdQueryFailure;

const baseOrderByIdInclude: Prisma.OrderInclude = {
  items: true,
  address: true,
  coupon: true,
  payments: {
    orderBy: { createdAt: "desc" },
    take: 5,
  },
  trackingEvents: {  // Optionally remove this if you don't need tracking event after migration
    orderBy: { occurredAt: "asc" },
  },
  shipments: {
    orderBy: { createdAt: "asc" },
    include: {
      trackingEvents: { orderBy: { occurredAt: "asc" } },
    },
  },
};

/**
 * Builds typed Prisma `where` + `include` for role-scoped order reads (user / seller / admin).
 */
export async function prepareGetOrderByIdQuery(
  params: PrepareGetOrderByIdQueryParams
): Promise<PrepareGetOrderByIdQueryResult> {
  const { orderId, userId, userRole } = params;

  let include: Prisma.OrderInclude = baseOrderByIdInclude;
  let sellerScopeId: string | null = null;

  if (userRole === "SELLER") {
    const seller = await prisma.seller.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!seller) {
      return { ok: false, code: "SELLER_PROFILE_NOT_FOUND" };
    }
    sellerScopeId = seller.id;
    include = {
      ...baseOrderByIdInclude,
      items: {
        where: { sellerId: sellerScopeId },
      },
    };
  }

  if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
    include = {
      ...include,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    };
  }

  const where: Prisma.OrderWhereInput = {
    id: orderId,
  };

  if (userRole === "USER") {
    where.userId = userId;
  }

  if (userRole === "SELLER" && sellerScopeId) {
    where.items = {
      some: {
        sellerId: sellerScopeId,
      },
    };
  }

  return { ok: true, where, include };
}

/**
 * Bounded page/limit for list endpoints (e.g. seller order lines).
 */
export function parseListPagination(
  pageRaw: unknown,
  limitRaw: unknown,
  defaults: { limit: number } = { limit: 20 }
): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(pageRaw ?? "1"), 10) || 1);
  const limit = Math.min(
    Math.max(1, parseInt(String(limitRaw ?? String(defaults.limit)), 10) || defaults.limit),
    100
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function totalPages(total: number, limit: number): number {
  return Math.max(1, Math.ceil(total / limit));
}

const userOrdersInclude = {
  items: true as const,
  address: true as const,
  payments: {
    orderBy: { createdAt: "desc" as const },
    take: 5 as const,
  },
  trackingEvents: {
    orderBy: { occurredAt: "asc" as const },
  },
  shipments: {
    orderBy: { createdAt: "asc" as const },
    include: {
      trackingEvents: { orderBy: { occurredAt: "asc" as const } },
    },
  },
};

const adminOrdersInclude: Prisma.OrderInclude = {
  items: true,
  address: true,
  payments: {
    orderBy: { createdAt: "desc" },
    take: 5,
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

const publicTrackOrderInclude: Prisma.OrderInclude = {
  items: true,
  address: true,
  payments: {
    orderBy: { createdAt: "desc" },
    take: 3,
  },
  trackingEvents: {
    orderBy: { occurredAt: "asc" },
  },
  shipments: {
    orderBy: { createdAt: "asc" },
    include: {
      trackingEvents: { orderBy: { occurredAt: "asc" } },
    },
  },
};

const sellerLineOrderSelect = {
  id: true,
  status: true,
  createdAt: true,
  total: true,
  paymentStatus: true,
} as const;

const sellerLineProductSelect = {
  id: true,
  name: true,
  images: true,
} as const;

/** Authenticated buyer: orders for account history. */
export function findOrdersForUser(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: userOrdersInclude,
    orderBy: { createdAt: "desc" },
  });
}

/** Admin dashboard: all orders with buyer summary. */
export function findOrdersForAdmin() {
  return prisma.order.findMany({
    include: adminOrdersInclude,
  });
}

/** Public tracking: order id + email (case-insensitive). */
export function findOrderForPublicTracking(
  orderId: string,
  emailNormalized: string
) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      user: {
        email: {
          equals: emailNormalized,
          mode: "insensitive",
        },
      },
    },
    include: publicTrackOrderInclude,
  });
}

/** Paginated seller revenue / fulfillment lines. */
export async function fetchSellerOrderLinesPage(
  sellerId: string,
  pageRaw: unknown,
  limitRaw: unknown
) {
  const { page, limit, skip } = parseListPagination(pageRaw, limitRaw);
  const [items, total] = await Promise.all([
    prisma.orderItem.findMany({
      where: { sellerId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        order: { select: sellerLineOrderSelect },
        product: { select: sellerLineProductSelect },
      },
    }),
    prisma.orderItem.count({ where: { sellerId } }),
  ]);
  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: totalPages(total, limit),
    },
  };
}

type AdminTransactionsFilters = {
  pageRaw: unknown;
  limitRaw: unknown;
  searchRaw: unknown;
  methodRaw: unknown;
  statusRaw: unknown;
  fromRaw: unknown;
  toRaw: unknown;
};

const paymentStatusWhitelist = new Set([
  "PENDING",
  "AUTHORIZED",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

const paymentMethodWhitelist = new Set(["PAYPAL", "STRIPE", "CREDIT_CARD"]);

/**
 * Super-admin payment transaction list + summary for dashboard reporting.
 */
export async function fetchAdminTransactionsPage(filters: AdminTransactionsFilters) {
  const { page, limit, skip } = parseListPagination(filters.pageRaw, filters.limitRaw, {
    limit: 20,
  });

  const search = String(filters.searchRaw ?? "").trim();
  const method = String(filters.methodRaw ?? "")
    .trim()
    .toUpperCase();
  const status = String(filters.statusRaw ?? "")
    .trim()
    .toUpperCase();

  const fromDate =
    typeof filters.fromRaw === "string" && filters.fromRaw.trim().length > 0
      ? new Date(filters.fromRaw)
      : null;
  const toDate =
    typeof filters.toRaw === "string" && filters.toRaw.trim().length > 0
      ? new Date(filters.toRaw)
      : null;

  const createdAtFilter: Prisma.DateTimeFilter = {};
  if (fromDate && !Number.isNaN(fromDate.getTime())) {
    createdAtFilter.gte = fromDate;
  }
  if (toDate && !Number.isNaN(toDate.getTime())) {
    const inclusiveTo = new Date(toDate);
    inclusiveTo.setHours(23, 59, 59, 999);
    createdAtFilter.lte = inclusiveTo;
  }

  const where: Prisma.PaymentWhereInput = {};

  if (paymentMethodWhitelist.has(method)) {
    where.method = method as "PAYPAL" | "STRIPE" | "CREDIT_CARD";
  }
  if (paymentStatusWhitelist.has(status)) {
    where.attemptStatus = status as
      | "PENDING"
      | "AUTHORIZED"
      | "COMPLETED"
      | "FAILED"
      | "CANCELLED";
  }
  if (Object.keys(createdAtFilter).length > 0) {
    where.createdAt = createdAtFilter;
  }
  if (search.length > 0) {
    where.OR = [
      { id: { contains: search, mode: "insensitive" } },
      { providerReferenceId: { contains: search, mode: "insensitive" } },
      {
        order: {
          id: { contains: search, mode: "insensitive" },
        },
      },
      {
        order: {
          user: {
            email: { contains: search, mode: "insensitive" },
          },
        },
      },
      {
        order: {
          user: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      },
    ];
  }

  const [items, total, aggregates, completedCount, failedCount] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            total: true,
            currency: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({
      where,
      _sum: { amount: true },
    }),
    prisma.payment.count({ where: { ...where, attemptStatus: "COMPLETED" } }),
    prisma.payment.count({ where: { ...where, attemptStatus: "FAILED" } }),
  ]);

  const summary = {
    totalTransactions: total,
    completedCount,
    failedCount,
    pendingCount: Math.max(0, total - completedCount - failedCount),
    totalAmount: aggregates._sum.amount ?? 0,
  };

  return {
    items,
    summary,
    meta: {
      page,
      limit,
      total,
      totalPages: totalPages(total, limit),
    },
  };
}
