// services/payment/providers/stripe.service.ts
import { PaymentOrderData, PaymentResult } from "../../interfaces/payment.interface";
import  { BasePaymentService } from '../base.payment.service';
import Stripe from 'stripe';
import { getErrorMessage } from "../../../utils/catchError";

export class StripeService extends BasePaymentService {
  protected providerName = "STRIPE";
  private stripe: Stripe;

  constructor() {
    super();
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16' as any,
    });
  }

  async createOrder(orderData: PaymentOrderData): Promise<PaymentResult> {
    try {
      const lineItems = orderData.items.map(item => ({
        price_data: {
          currency: orderData.currency?.toLowerCase() || 'usd',
          product_data: {
            name: item.productName,
            metadata: {
              productId: item.productId
            }
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      }));

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        metadata: {
          userId: orderData.userId,
          internalOrderId: orderData.internalOrderId,
          orderType: 'ecommerce'
        },
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'IN']
        }
      });

      return {
        success: true,
        paymentId: session.id,
        orderId: session.id,
        url: session.url!,
        data: {
          sessionId: session.id,
          url: session.url
        }
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  async capturePayment(paymentId: string): Promise<PaymentResult> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(paymentId);
      
      if (session.payment_status === 'paid') {
        return {
          success: true,
          paymentId: session.id,
          data: session
        };
      } else {
        return {
          success: false,
          error: 'Payment not completed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  validatePayment(data: any): boolean {
    return this.validatePaymentData(data);
  }

  async getOrderDetails(paymentId: string): Promise<PaymentResult> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(paymentId);
      
      return {
        success: true,
        paymentId: session.id,
        orderId: session.id,
        data: session
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  async verifyWebhookSignature(
    rawBody: string,
    signature: string,
    _timestamp: string,
    _certUrl?: string,
    _transmissionId?: string
  ): Promise<boolean> {
    try {
      // Stripe automatically verifies in constructEvent
      return true; // Stripe handles verification in handleWebhook
    } catch (error) {
      return false;
    }
  }

  async handleWebhook(payload: any, signature: string): Promise<any> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          return { success: true, event: 'payment_success', data: session };
        
        case 'payment_intent.payment_failed':
          const paymentIntent = event.data.object;
          return { success: false, event: 'payment_failed', data: paymentIntent };
          
        default:
          return { success: true, event: 'unknown', data: event };
      }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Stripe-specific methods
  isCheckoutBased(): boolean {
    return true; // Stripe uses checkout sessions
  }
}