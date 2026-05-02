// services/payment/payment.service.ts
import { BasePaymentService } from "./base.payment.service";
import { PaymentFactory } from "./payment.factory";
import { PaymentOrderData, PaymentResult, WebhookEvent } from "../interfaces/payment.interface";

export class PaymentService {
  private provider: BasePaymentService;

  constructor(paymentMethod: string) {
    this.provider = PaymentFactory.createPaymentService(paymentMethod);
  }

  async createOrder(orderData: PaymentOrderData): Promise<PaymentResult> {
    return this.provider.createOrder(orderData);
  }

  async capturePayment(paymentId: string, data?: any): Promise<PaymentResult> {
    return this.provider.capturePayment(paymentId, data);
  }

  async getOrderDetails(paymentId: string): Promise<PaymentResult> {
    return this.provider.getOrderDetails(paymentId);
  }

  async verifyWebhookSignature(
    rawBody: string,
    signature: string,
    timestamp: string,
    cetUrl: string,
    transmissionId?: string
  ): Promise<boolean> {
    return this.provider.verifyWebhookSignature(
      rawBody,
      signature,
      timestamp,
      cetUrl,
      transmissionId
    );
  }

  async handleWebhook(event: WebhookEvent): Promise<any> {
    // Pass the payload and signature as separate arguments
    return this.provider.handleWebhook(event.payload, event.signature);
  }

  getName(): string {
    return this.provider.getName();
  }

  isRedirectBased(): boolean {
    return this.provider.isRedirectBased();
  }

  isClientSecretBased(): boolean {
    return this.provider.isClientSecretBased();
  }
  
  isCheckoutBased(): boolean {
    return this.provider.isCheckoutBased();
  }
}