import { BasePaymentService } from "./base.payment.service";
import { PayPalService } from "./providers/paypal.service";
import { StripeService } from "./providers/stripe.service";
import {
  CheckoutPaymentMethod,
  getAvailablePaymentMethods,
  normalizePaymentMethod,
} from "./paymentMethod";

export class PaymentFactory {
  static createPaymentService(method: string): BasePaymentService {
    const normalized = normalizePaymentMethod(method);
    if (!normalized) {
      throw new Error(`Unsupported payment method: ${method}`);
    }

    switch (normalized) {
      case "PAYPAL":
        return new PayPalService();
      case "STRIPE":
        return new StripeService();
      default:
        throw new Error(`Unsupported payment method: ${method}`);
    }
  }

  static createPaymentMethod(method: string): BasePaymentService {
    return this.createPaymentService(method);
  }

  static getAvailableMethods(): CheckoutPaymentMethod[] {
    return getAvailablePaymentMethods();
  }
}

export type { CheckoutPaymentMethod };
