import { AuthenticatedRequest } from "../types/express";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError, UnauthorizedError } from "../utils/ApiError";
import { PaymentFactory } from "../services/payment/payment.factory";
import { PaymentOrderData } from "../services/interfaces/payment.interface";
import type { MinimalProduct } from "../services/interfaces/product";
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
    const { items, total, paymentMethod, addressId, couponId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return next(new UnauthorizedError("Unauthorized user"));
    }

    // Validate required fields
    if (!addressId) {
      return next(new ApiError(400, "Shipping address is required"));
    }

    try {
      // 1. Validate payment method
      const availableMethods = PaymentFactory.getAvailableMethods();
      if (!availableMethods.includes(paymentMethod.toUpperCase())) {
        return next(
          new ApiError(
            400,
            `Payment method '${paymentMethod}' is not supported`,
          ),
        );
      }

      const productIds = Array.from(
        new Set(
          (items as MinimalProduct[])
            .map((item) => item.productId)
            .filter((pid): pid is string => typeof pid === "string" && pid.length > 0),
        ),
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
          paymentMethod: paymentMethod.toUpperCase() as any,
          paymentStatus: "PENDING",
          items: {
            create: items.map((item: MinimalProduct) => ({
              productId: item.productId,
              sellerId: item.productId
                ? sellerIdByProductId.get(item.productId) ?? null
                : null,
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

      // FIXED: Use createPaymentService instead of createPaymentMethod
      const paymentService = PaymentFactory.createPaymentService(paymentMethod);

      const paymentOrderData: PaymentOrderData = {
        items,
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
          method: paymentMethod.toUpperCase() as "PAYPAL" | "STRIPE" | "CREDIT_CARD",
          attemptStatus: "PENDING",
          providerReferenceId: providerRef,
          approvalUrl: paymentResult.approvalUrl,
          checkoutUrl: paymentResult.url,
          clientSecret: paymentResult.clientSecret,
          amount: total,
          currency: "USD",
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
        paymentMethod: paymentMethod.toUpperCase(),
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
    const userId = req.user?.userId;

    if (!paymentId || !paymentMethod || !internalOrderId) {
      return next(new ApiError(400, "Missing required fields"));
    }

    if (!userId) {
      return next(new UnauthorizedError("Unauthorized user"));
    }

    try {
      // 1. Verify the order belongs to the user
      const existingOrder = await prisma.order.findFirst({
        where: {
          id: internalOrderId,
          userId,
          status: "PENDING_PAYMENT",
          paymentStatus: "PENDING",
        },
        include: {
          items: true,
          payments: { orderBy: { createdAt: "desc" } },
        },
      });

      if (!existingOrder) {
        return next(
          new ApiError(404, "Order not found or not in correct state"),
        );
      }

      const paymentRow = existingOrder.payments.find(
        (p) => p.providerReferenceId === paymentId
      );
      if (!paymentRow) {
        return next(
          new ApiError(404, "Payment session not found for this order"),
        );
      }

      // 2. FIXED: Use createPaymentService instead of createPaymentMethod
      const paymentService = PaymentFactory.createPaymentService(paymentMethod);

      // For card payments, pass cardData as second parameter
      let captureResult;
      if (paymentMethod.toUpperCase() === "CARD" && cardData) {
        captureResult = await paymentService.capturePayment(
          paymentId,
          cardData,
        );
      } else {
        captureResult = await paymentService.capturePayment(paymentId);
      }

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

      // 4. Update stock and clear cart
      await applyPurchaseFulfillment(userId, existingOrder.items);

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

// const getOrder = asyncHandler(
//   async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
//     const userId = req.user?.userId;
//     const { orderId } = req.params;

//     if (!userId) {
//       return res.status(401).json(new ApiError(401, "Unauthenticated user"));
//     }
//     //  TODO: check the input by zod

//     const order = await prisma.order.findFirst({
//       where: {
//         id: orderId,
//         userId,
//       },
//       select: {
//         items: true,
//         address: true,
//         coupon: true,
//       },
//     });

//     return res
//       .status(200)
//       .json(new ApiResponse(200, order, "orders fetched successfully"));
//   },
// );
// TODO: should do it for single or multiple order? validate the input req.params+body
const updateOrderStatusAdminOnly = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json(new UnauthorizedError("Unauthenticated user"));
    }

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

const getAllOrdersAdminOnly = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    if (!userId) {
      return res
        .status(401)
        .json(new UnauthorizedError("Unauthenticated user"));
    }

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
    const userId = req.user?.userId;
    if (!userId) {
      return next(new UnauthorizedError("Unauthenticated user"));
    }

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
  const userId = req.user?.userId;
  const { orderId } = req.params;
  const userRole = req.user?.role;

  if (!userId) {
    return next(new UnauthorizedError("Unauthorized user"));
  }

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
    const userId = req.user?.userId;
    if (!userId) {
      return next(new UnauthorizedError("Unauthenticated user"));
    }

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
  // getOrder,
  updateOrderStatusAdminOnly,
  getAllOrdersAdminOnly,
  getAllOrdersForUser,
  // getOrdersByUserId,
  getOrderById,
  getSellerOrderLines,
  getAdminTransactions,
  trackOrderPublic,
};
