// services/payment/base.payment.service.ts
import { PaymentMethod, PaymentOrderData, PaymentResult } from "../interfaces/payment.interface";

export abstract class BasePaymentService implements PaymentMethod {
  protected abstract providerName: string;
  
  abstract createOrder(orderData: PaymentOrderData): Promise<PaymentResult>;
  abstract capturePayment(paymentId: string, data?: any): Promise<PaymentResult>;
  abstract validatePayment(data: any): boolean;
  
  // Optional methods with default implementations
  async getOrderDetails(paymentId: string): Promise<PaymentResult> {
    // Default implementation - can be overridden
    return {
      success: false,
      error: "getOrderDetails not implemented for this payment method"
    };
  }
  
  async verifyWebhookSignature(
    rawBody: string,
    signature: string,
    timestamp: string,
    certUrl: string,
    _transmissionId?: string
  ): Promise<boolean> {
    // Default implementation
    console.log(`Webhook verification not implemented for ${this.providerName}`);
    return false;
  }
  
  async handleWebhook(payload: any, signature: string): Promise<any> {
    // Default implementation
    console.log(`Webhook handling not implemented for ${this.providerName}`);
    return { success: false, error: "Not implemented" };
  }
  
  getName(): string {
    return this.providerName;
  }
  
  // Helper methods
  protected validatePaymentData(orderData: PaymentOrderData): boolean {
    if (!orderData.items || orderData.items.length === 0) {
      return false;
    }
    
    if (typeof orderData.total !== 'number' || orderData.total <= 0) {
      return false;
    }
    
    return orderData.items.every(item => 
      item &&
      typeof item.productId === 'string' &&
      typeof item.productName === 'string' &&
      typeof item.price === 'number' &&
      item.price >= 0 &&
      typeof item.quantity === 'number' &&
      item.quantity > 0
    );
  }
  
  protected calculateItemTotal(items: any[]): number {
    return items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );
  }
  
  // Payment flow type detection
  isRedirectBased(): boolean {
    return false; // Default - override in child classes
  }
  
  isClientSecretBased(): boolean {
    return false; // Default - override in child classes
  }
  
  isCheckoutBased(): boolean {
    return false; // Default - override in child classes
  }
}