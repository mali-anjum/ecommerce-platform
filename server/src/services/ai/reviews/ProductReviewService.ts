import { OrderStatus, ProductReviewStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { ApiError } from "../../../utils/ApiError";
import { classifyReviewWithRules } from "./ReviewThemeClassifier";

export async function createProductReview(input: {
  userId: string;
  productId: string;
  orderId?: string;
  rating: number;
  body: string;
}) {
  const product = await prisma.product.findFirst({
    where: { id: input.productId, isActive: true, isArchived: false },
    select: { id: true },
  });
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (input.orderId) {
    const order = await prisma.order.findFirst({
      where: {
        id: input.orderId,
        userId: input.userId,
        status: OrderStatus.DELIVERED,
      },
      include: {
        items: { select: { productId: true } },
      },
    });
    if (!order) {
      throw new ApiError(400, "Delivered order required to attach a review");
    }
    const purchased = order.items.some(
      (item) => item.productId === input.productId,
    );
    if (!purchased) {
      throw new ApiError(400, "This product was not part of the selected order");
    }
  }

  const classification = classifyReviewWithRules({
    rating: input.rating,
    body: input.body,
  });

  const review = await prisma.productReview.create({
    data: {
      productId: input.productId,
      userId: input.userId,
      orderId: input.orderId,
      rating: input.rating,
      body: input.body.trim(),
      themes: classification.themes,
      sentiment: classification.sentiment,
      status: ProductReviewStatus.APPROVED,
      analyzedAt: new Date(),
    },
    select: {
      id: true,
      productId: true,
      rating: true,
      body: true,
      themes: true,
      sentiment: true,
      createdAt: true,
    },
  });

  const aggregates = await prisma.productReview.aggregate({
    where: { productId: input.productId, status: ProductReviewStatus.APPROVED },
    _avg: { rating: true },
    _count: { _all: true },
  });

  if (aggregates._avg.rating != null) {
    await prisma.product.update({
      where: { id: input.productId },
      data: {
        rating: Math.round(aggregates._avg.rating * 10) / 10,
      },
    });
  }

  return {
    review: {
      ...review,
      createdAt: review.createdAt.toISOString(),
    },
    reviewCount: aggregates._count._all,
  };
}

export async function listProductReviews(productId: string, limit = 20) {
  const reviews = await prisma.productReview.findMany({
    where: {
      productId,
      status: ProductReviewStatus.APPROVED,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      rating: true,
      body: true,
      themes: true,
      sentiment: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    body: review.body,
    themes: review.themes,
    sentiment: review.sentiment,
    authorName: review.user?.name ?? "Customer",
    createdAt: review.createdAt.toISOString(),
  }));
}
