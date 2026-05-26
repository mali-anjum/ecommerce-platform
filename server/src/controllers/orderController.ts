import { AuthenticatedRequest } from "../types/express";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError, UnauthorizedError } from "../utils/ApiError";
import { requireUserId } from "../utils/requireUserId";
import { PaymentFactory } from "../services/payment/payment.factory";
import {
  getAvailablePaymentMethods,
  normalizePaymentMethod,
  toPrismaPaymentMethod,
} from "../services/payment/paymentMethod";
import { PaymentOrderData } from "../services/interfaces/payment.interface";
import {
  calculateCheckoutTotals,
} from "../services/cart/checkoutTotals";
import { validateCheckoutSelection } from "../services/cart/validateCheckoutSelection";
import {
  applyPurchaseFulfillment,
  fetchSellerOrderLinesPage,
  fetchAdminTransactionsPage,
  findOrderForPublicTracking,
  findOrdersForAdmin,
  findOrdersForUser,
  mapOrdersWithLegacyPaymentAliases,
  prepareGetOrderByIdQuery,
  resolveSellerIdsForProductIds,
  updateOrderStatusById,
  withLegacyPaymentAliases,
} from "../services/order";
import type { OrderStatus } from "@prisma/client";

const createPaymentOrder = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { cartItemIds, paymentMethod, addressId, couponId } = req.body;
    const userId = requireUserId(req);

    // Validate required fields
    if (!addressId) {
      return next(new ApiError(400, "Shipping address is required"));
    }

    try {
      const normalizedMethod = normalizePaymentMethod(paymentMethod);
      const availableMethods = getAvailablePaymentMethods();

      if (!normalizedMethod) {
        return next(new ApiError(400, `Payment method '${paymentMethod}' is not supported`));
      }

      if (!availableMethods.includes(normalizedMethod)) {
        return next(
          new ApiError(
            503,
            `Payment method '${normalizedMethod}' is not configured on the server. Check PayPal/Stripe env vars.`,
          ),
        );
      }

      if (availableMethods.length === 0) {
        return next(
          new ApiError(503, "No payment providers are configured on the server"),
        );
      }

      const validatedItems = await validateCheckoutSelection(userId, cartItemIds);

      let couponDiscountPercent = 0;
      if (couponId) {
        const coupon = await prisma.coupon.findUnique({
          where: { id: couponId },
        });
        if (!coupon) {
          return next(new ApiError(400, "Coupon is invalid or expired"));
        }
        couponDiscountPercent = coupon.discountPercent;
      }

      const lineSubtotal = validatedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const checkoutTotals = calculateCheckoutTotals(
        lineSubtotal,
        couponDiscountPercent
      );
      const total = checkoutTotals.total;
      const selectedCartItemIds = validatedItems.map((item) => item.cartItemId);

      const productIds = Array.from(
        new Set(validatedItems.map((item) => item.productId))
      );
      const sellerIdByProductId =
        productIds.length > 0
          ? await resolveSellerIdsForProductIds(productIds)
          : new Map<string, string | null>();

      const draftOrder = await prisma.order.create({
        data: {
          userId,
          addressId,
          couponId,
          total,
          currency: "USD",
          status: "DRAFT", // Use DRAFT status
          paymentMethod: toPrismaPaymentMethod(normalizedMethod),
          paymentStatus: "PENDING",
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              sellerId: sellerIdByProductId.get(item.productId) ?? null,
              productName: item.productName,
              productCategory: item.productCategory,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              price: item.price,
            })),
          },
        },
        include: {
          items: true,
          address: true,
          coupon: true,
        },
      });

      const paymentService = PaymentFactory.createPaymentService(normalizedMethod);

      const paymentOrderData: PaymentOrderData = {
        items: validatedItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productCategory: item.productCategory,
          quantity: item.quantity,
          size: item.size ?? undefined,
          color: item.color ?? undefined,
          price: item.price,
        })),
        total,
        userId,
        currency: "USD",
        internalOrderId: draftOrder.id,
      };

      const paymentResult = await paymentService.createOrder(paymentOrderData);

      if (!paymentResult.success) {
        await prisma.order.update({
          where: { id: draftOrder.id },
          data: {
            status: "PAYMENT_FAILED",
            paymentStatus: "FAILED",
          },
        });

        return next(
          new ApiError(
            400,
            paymentResult.error || "Payment order creation failed",
          ),
        );
      }

      const providerRef =
        paymentResult.paymentId ?? paymentResult.orderId ?? null;

      await prisma.payment.create({
        data: {
          orderId: draftOrder.id,
          method: toPrismaPaymentMethod(normalizedMethod),
          attemptStatus: "PENDING",
          providerReferenceId: providerRef,
          approvalUrl: paymentResult.approvalUrl,
          checkoutUrl: paymentResult.url,
          clientSecret: paymentResult.clientSecret,
          amount: total,
          currency: "USD",
          metadata: { cartItemIds: selectedCartItemIds },
        },
      });

      await prisma.order.update({
        where: { id: draftOrder.id },
        data: {
          status: "PENDING_PAYMENT",
          paymentStatus: "PENDING",
        },
      });

      // 5. Prepare response
      const responseData: any = {
        internalOrderId: draftOrder.id,
        paymentId: paymentResult.paymentId!,
        providerOrderId: paymentResult.orderId!,
        status: "PENDING_PAYMENT",
        paymentMethod: normalizedMethod,
      };

      // Add provider-specific response fields
      if (paymentResult.approvalUrl) {
        responseData.approvalUrl = paymentResult.approvalUrl;
      }
      if (paymentResult.url) {
        responseData.url = paymentResult.url; // For Stripe
      }
      if (paymentResult.clientSecret) {
        responseData.clientSecret = paymentResult.clientSecret;
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            responseData,
            `${paymentMethod} order created successfully`,
          ),
        );
    } catch (error) {
      next(error);
    }
  },
);

const capturePayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { paymentId, paymentMethod, internalOrderId, cardData } = req.body;
    const userId = requireUserId(req);

    if (!paymentId || !paymentMethod || !internalOrderId) {
      return next(new ApiError(400, "Missing required fields"));
    }

    const normalizedMethod = normalizePaymentMethod(paymentMethod);
    if (!normalizedMethod) {
      return next(new ApiError(400, `Payment method '${paymentMethod}' is not supported`));
    }

    try {
      // 1. Verify the order belongs to the user
      const existingOrder = await prisma.order.findFirst({
        where: {
          id: internalOrderId,
          userId,
        },
        include: {
          items: true,
          address: true,
          coupon: true,
          payments: { orderBy: { createdAt: "desc" } },
        },
      });

      if (!existingOrder) {
        return next(
          new ApiError(404, "Order not found or not in correct state"),
        );
      }

      // Idempotent success path: capture might have completed already on a previous request.
      if (
        existingOrder.paymentStatus === "COMPLETED" ||
        ["PROCESSING", "SHIPPED", "DELIVERED"].includes(existingOrder.status)
      ) {
        return res.status(200).json(
          new ApiResponse(
            200,
            {
              order: withLegacyPaymentAliases(existingOrder),
              captureData: null,
            },
            "Payment already captured for this order",
          ),
        );
      }

      const capturableStatuses = new Set(["PENDING_PAYMENT", "PAYMENT_APPROVED", "CAPTURE_FAILED"]);
      if (!capturableStatuses.has(existingOrder.status)) {
        return next(
          new ApiError(409, `Order is not capturable in status '${existingOrder.status}'`),
        );
      }

      const paymentRow = existingOrder.payments.find(
        (p) => p.providerReferenceId === paymentId || p.providerCaptureId === paymentId
      );
      if (!paymentRow) {
        return next(
          new ApiError(404, "Payment session not found for this order"),
        );
      }

      // 2. FIXED: Use createPaymentService instead of createPaymentMethod
      const paymentService = PaymentFactory.createPaymentService(normalizedMethod);
      const captureResult = await paymentService.capturePayment(paymentId);

      if (!captureResult.success) {
        await prisma.payment.update({
          where: { id: paymentRow.id },
          data: { attemptStatus: "FAILED" },
        });
        await prisma.order.update({
          where: { id: internalOrderId },
          data: {
            status: "CAPTURE_FAILED",
            paymentStatus: "FAILED",
          },
        });
        return next(
          new ApiError(400, captureResult.error || "Payment capture failed"),
        );
      }

      await prisma.payment.update({
        where: { id: paymentRow.id },
        data: {
          attemptStatus: "COMPLETED",
          providerCaptureId:
            captureResult.captureId ?? captureResult.data?.id ?? null,
          capturedAt: new Date(),
        },
      });

      const updatedOrder = await prisma.order.update({
        where: { id: internalOrderId },
        data: {
          status: "PROCESSING",
          paymentStatus: "COMPLETED",
        },
        include: {
          items: true,
          address: true,
          coupon: true,
          payments: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      });

      const paymentMetadata = paymentRow.metadata as
        | { cartItemIds?: string[] }
        | null
        | undefined;
      const purchasedCartItemIds = Array.isArray(paymentMetadata?.cartItemIds)
        ? paymentMetadata.cartItemIds
        : undefined;

      // 4. Update stock and remove only purchased cart lines
      await applyPurchaseFulfillment(
        userId,
        existingOrder.items,
        purchasedCartItemIds
      );

      // 5. Apply coupon usage if exists
      if (existingOrder.couponId) {
        await prisma.coupon.update({
          where: { id: existingOrder.couponId },
          data: { usageCount: { increment: 1 } },
        });
      }

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            order: withLegacyPaymentAliases(updatedOrder),
            captureData: captureResult.data,
          },
          "Payment captured and order completed successfully",
        ),
      );
    } catch (error) {
      next(error);
    }
  },
);

// TODO: should do it for single or multiple order? validate the input req.params+body
const updateOrderStatusAdminOnly = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = requireUserId(req, "Unauthenticated user");

    const { orderId } = req.params;
    const { status } = req.body;

    const statusUpdated = await updateOrderStatusById(
      orderId,
      status as OrderStatus,
    );

    if (!statusUpdated) {
      return res
        .status(401)
        .json(
          new ApiError(401, "Error occured while updateing the order status"),
        );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, statusUpdated, "stauts updated successfully"));
  },
);
// TODO: optimize and reusable for date and add validation for the input
const upsertOrderTrackingAdminOnly = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = requireUserId(req, "Unauthenticated user");

    const { orderId } = req.params;
    if (!orderId || typeof orderId !== "string" || orderId.trim() === "") {
      return next(new ApiError(400, "orderId is required"));
    }

    const carrier =
      typeof req.body?.carrier === "string" ? req.body.carrier.trim() : undefined;
    const trackingNumber =
      typeof req.body?.trackingNumber === "string"
        ? req.body.trackingNumber.trim()
        : undefined;

    const etaRaw = req.body?.estimatedDeliveryAt;
    const shippedAtRaw = req.body?.shippedAt;
    const deliveredAtRaw = req.body?.deliveredAt;

    const parseOptionalDate = (value: unknown) => {
      if (value === undefined) return undefined;
      if (value === null || String(value).trim() === "") return null;
      const parsed = new Date(String(value));
      if (Number.isNaN(parsed.getTime())) {
        throw new ApiError(400, "Invalid datetime value");
      }
      return parsed;
    };

    let estimatedDeliveryAt: Date | null | undefined = undefined;
    let shippedAt: Date | null | undefined = undefined;
    let deliveredAt: Date | null | undefined = undefined;

    try {
      estimatedDeliveryAt = parseOptionalDate(etaRaw);
      shippedAt = parseOptionalDate(shippedAtRaw);
      deliveredAt = parseOptionalDate(deliveredAtRaw);
    } catch (err) {
      return next(err as Error);
    }

    // Ensure the order exists first.
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!order) {
      return next(new ApiError(404, "Order not found"));
    }

    // Minimal recommended: store shipment fields on a default shipment row.
    await prisma.orderShipment.upsert({
      where: { orderId_key: { orderId, key: "DEFAULT" } },
      create: {
        orderId,
        key: "DEFAULT",
        carrier: carrier?.length ? carrier : null,
        trackingNumber: trackingNumber?.length ? trackingNumber : null,
        estimatedDeliveryAt:
          estimatedDeliveryAt === undefined ? undefined : estimatedDeliveryAt,
        shippedAt: shippedAt === undefined ? undefined : shippedAt,
        deliveredAt: deliveredAt === undefined ? undefined : deliveredAt,
      },
      update: {
        ...(carrier !== undefined ? { carrier: carrier || null } : {}),
        ...(trackingNumber !== undefined
          ? { trackingNumber: trackingNumber || null }
          : {}),
        ...(estimatedDeliveryAt !== undefined
          ? { estimatedDeliveryAt }
          : {}),
        ...(shippedAt !== undefined ? { shippedAt } : {}),
        ...(deliveredAt !== undefined ? { deliveredAt } : {}),
      },
    });

    const updated = await prisma.order.findFirst({
      where: { id: orderId },
      include: {
        items: true,
        address: true,
        coupon: true,
        payments: { orderBy: { createdAt: "desc" }, take: 5 },
        trackingEvents: { orderBy: { occurredAt: "asc" } },
        shipments: {
          orderBy: { createdAt: "asc" },
          include: { trackingEvents: { orderBy: { occurredAt: "asc" } } },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, updated, "Order shipment tracking updated"));
  }
);

const addOrderTrackingEventAdminOnly = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    requireUserId(req, "Unauthenticated user");

    const { orderId } = req.params;
    if (!orderId || typeof orderId !== "string" || orderId.trim() === "") {
      return next(new ApiError(400, "orderId is required"));
    }

    const message = String(req.body?.message ?? "").trim();
    const location =
      typeof req.body?.location === "string" ? req.body.location.trim() : null;

    const statusRaw = req.body?.status;
    const status =
      typeof statusRaw === "string" && statusRaw.trim().length > 0
        ? (statusRaw.trim().toUpperCase() as OrderStatus)
        : null;

    const occurredAtRaw = req.body?.occurredAt;
    const occurredAt = occurredAtRaw
      ? new Date(String(occurredAtRaw))
      : new Date();
    if (Number.isNaN(occurredAt.getTime())) {
      return next(new ApiError(400, "occurredAt is invalid"));
    }

    if (!message) {
      return next(new ApiError(400, "message is required"));
    }

    const orderExists = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!orderExists) {
      return next(new ApiError(404, "Order not found"));
    }

    // Attach event to the default shipment; create it if missing.
    const shipment = await prisma.orderShipment.upsert({
      where: { orderId_key: { orderId, key: "DEFAULT" } },
      create: { orderId, key: "DEFAULT" },
      update: {},
      select: { id: true },
    });

    const event = await prisma.orderTrackingEvent.create({
      data: {
        orderId,
        shipmentId: shipment.id,
        message,
        location,
        occurredAt,
        ...(status ? { status } : {}),
      },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, event, "Tracking event added"));
  }
);

const getAllOrdersAdminOnly = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    requireUserId(req, "Unauthenticated user");

    const orders = await findOrdersForAdmin();

    if (!orders || orders.length === 0) {
      return res.status(404).json(new ApiError(404, "No orders found."));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          mapOrdersWithLegacyPaymentAliases(orders),
          "All orders fetched for the admin sucessfully.",
        ),
      );
  },
);

const getAllOrdersForUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = requireUserId(req, "Unauthenticated user");

    const orders = await findOrdersForUser(userId);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          mapOrdersWithLegacyPaymentAliases(orders),
          "User orders fetched successfully.",
        ),
      );
  }
);


const getOrderById = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = requireUserId(req);
  const { orderId } = req.params;
  const userRole = req.user?.role;

  const query = await prepareGetOrderByIdQuery({
    orderId,
    userId,
    userRole,
  });

  if (!query.ok) {
    return next(new ApiError(403, "Seller profile not found"));
  }

  const order = await prisma.order.findFirst({
    where: query.where,
    include: query.include,
  });

  if (!order) {
    return next(new ApiError(404, "Order not found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        withLegacyPaymentAliases(order),
        "Order fetched successfully",
      ),
    );
});

const trackOrderPublic = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const orderId = String(req.body?.orderId || "").trim();
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    if (!orderId || !email) {
      return next(new ApiError(400, "orderId and email are required"));
    }

    const trackedOrder = await findOrderForPublicTracking(orderId, email);

    if (!trackedOrder) {
      return next(new ApiError(404, "No order found for provided details"));
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        withLegacyPaymentAliases(trackedOrder),
        "Order tracking details fetched successfully"
      )
    );
  }
);

/** Line items for the authenticated seller (marketplace revenue / fulfillment). */
const getSellerOrderLines = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError("Unauthorized user"));
    }
    if (req.user.role !== "SELLER") {
      return next(new ApiError(403, "Seller access required"));
    }
    const sellerId = req.sellerProfile?.id;
    if (!sellerId) {
      return next(new ApiError(403, "Seller profile not found"));
    }

    const { items, meta } = await fetchSellerOrderLinesPage(
      sellerId,
      req.query.page,
      req.query.limit
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        { items, meta },
        "Seller order lines fetched"
      )
    );
  }
);

/** Super-admin transactions feed (payment attempts) with summary + filters. */
const getAdminTransactions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    requireUserId(req, "Unauthenticated user");

    const { items, summary, meta } = await fetchAdminTransactionsPage({
      pageRaw: req.query.page,
      limitRaw: req.query.limit,
      searchRaw: req.query.search,
      methodRaw: req.query.method,
      statusRaw: req.query.status,
      fromRaw: req.query.from,
      toRaw: req.query.to,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        { items, summary, meta },
        "Admin transactions fetched successfully"
      )
    );
  }
);

export {
  createPaymentOrder,
  capturePayment,
  updateOrderStatusAdminOnly,
  getAllOrdersAdminOnly,
  getAllOrdersForUser,
  getOrderById,
  getSellerOrderLines,
  getAdminTransactions,
  trackOrderPublic,
  upsertOrderTrackingAdminOnly,
  addOrderTrackingEventAdminOnly,
};
