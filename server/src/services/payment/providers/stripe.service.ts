import {
  PaymentOrderData,
  PaymentResult,
} from "../../interfaces/payment.interface";
import { BasePaymentService } from "../base.payment.service";
import Stripe from "stripe";
import { getErrorMessage } from "../../../utils/catchError";

function resolveStripeRedirectUrls(): { successUrl: string; cancelUrl: string } {
  const base =
    process.env.STRIPE_CHECKOUT_BASE_URL?.trim() ||
    process.env.FRONTEND_URL?.trim() ||
    "http://localhost:3012";

  const normalizedBase = base.replace(/\/$/, "");

  const successUrl =
    process.env.STRIPE_SUCCESS_URL?.trim() ||
    `${normalizedBase}/stripe/return?session_id={CHECKOUT_SESSION_ID}`;

  const cancelUrl =
    process.env.STRIPE_CANCEL_URL?.trim() ||
    `${normalizedBase}/stripe/cancel`;

  return { successUrl, cancelUrl };
}

export class StripeService extends BasePaymentService {
  protected providerName = "STRIPE";
  private stripe: Stripe | null = null;

  private getStripe(): Stripe {
    if (this.stripe) {
      return this.stripe;
    }

    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secretKey) {
      throw new Error(
        "STRIPE_SECRET_KEY is not configured. Add it to server env to enable card checkout."
      );
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    });
    return this.stripe;
  }

  async createOrder(orderData: PaymentOrderData): Promise<PaymentResult> {
    try {
      if (!this.validatePaymentData(orderData)) {
        return {
          success: false,
          error: "Invalid payment data",
        };
      }

      const itemsSubtotal = this.calculateItemTotal(orderData.items);
      const tolerance = 0.01;

      if (orderData.total + tolerance < itemsSubtotal) {
        return {
          success: false,
          error: "Order total is less than the sum of line items",
        };
      }

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
        orderData.items.map((item) => ({
          price_data: {
            currency: (orderData.currency || "USD").toLowerCase(),
            product_data: {
              name: item.productName.substring(0, 127),
              metadata: {
                productId: item.productId,
              },
            },
            unit_amount: Math.max(0, Math.round(item.price * 100)),
          },
          quantity: Math.max(1, item.quantity),
        }));

      const remainder = orderData.total - itemsSubtotal;
      if (remainder > tolerance) {
        lineItems.push({
          price_data: {
            currency: (orderData.currency || "USD").toLowerCase(),
            product_data: {
              name: "Shipping, tax & fees",
            },
            unit_amount: Math.round(remainder * 100),
          },
          quantity: 1,
        });
      }

      const { successUrl, cancelUrl } = resolveStripeRedirectUrls();
      const stripe = this.getStripe();

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: orderData.internalOrderId,
        metadata: {
          userId: orderData.userId,
          internalOrderId: orderData.internalOrderId,
          orderType: "ecommerce",
        },
      });

      if (!session.url) {
        return {
          success: false,
          error: "Stripe did not return a checkout URL",
        };
      }

      return {
        success: true,
        paymentId: session.id,
        orderId: session.id,
        url: session.url,
        data: {
          sessionId: session.id,
          url: session.url,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  async capturePayment(paymentId: string): Promise<PaymentResult> {
    try {
      const stripe = this.getStripe();
      const session = await stripe.checkout.sessions.retrieve(paymentId, {
        expand: ["payment_intent"],
      });

      if (session.payment_status === "paid") {
        const paymentIntent =
          typeof session.payment_intent === "object"
            ? session.payment_intent
            : null;

        return {
          success: true,
          paymentId: session.id,
          captureId: paymentIntent?.id,
          data: session,
        };
      }

      return {
        success: false,
        error: `Payment not completed (status: ${session.payment_status})`,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  validatePayment(data: unknown): boolean {
    return this.validatePaymentData(data as PaymentOrderData);
  }

  async getOrderDetails(paymentId: string): Promise<PaymentResult> {
    try {
      const stripe = this.getStripe();
      const session = await stripe.checkout.sessions.retrieve(paymentId);

      return {
        success: true,
        paymentId: session.id,
        orderId: session.id,
        data: session,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  async verifyWebhookSignature(
    _rawBody: string,
    _signature: string,
    _timestamp: string,
    _certUrl?: string,
    _transmissionId?: string
  ): Promise<boolean> {
    return Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
  }

  async handleWebhook(payload: string | Buffer, signature: string): Promise<{
    success: boolean;
    event?: string;
    data?: Stripe.Checkout.Session | Stripe.PaymentIntent;
    error?: string;
  }> {
    try {
      const stripe = this.getStripe();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
      if (!webhookSecret) {
        return { success: false, error: "STRIPE_WEBHOOK_SECRET is not configured" };
      }

      const rawBody =
        typeof payload === "string" ? payload : payload.toString("utf8");

      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );

      switch (event.type) {
        case "checkout.session.completed":
          return {
            success: true,
            event: "payment_success",
            data: event.data.object as Stripe.Checkout.Session,
          };

        case "payment_intent.payment_failed":
          return {
            success: false,
            event: "payment_failed",
            data: event.data.object as Stripe.PaymentIntent,
          };

        default:
          return { success: true, event: "unknown", data: event.data.object as Stripe.Checkout.Session };
      }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }

  isCheckoutBased(): boolean {
    return true;
  }

  isRedirectBased(): boolean {
    return true;
  }
}
