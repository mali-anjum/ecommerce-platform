// services/payment/providers/card.service.ts
import {  PaymentOrderData, PaymentResult } from "../../interfaces/payment.interface";
import { BasePaymentService } from "../base.payment.service";
import { getErrorMessage } from "../../../utils/catchError";
import { sentryTracker } from "../../../lib/monitoring";

export class CardService extends BasePaymentService {
  protected providerName = "CARD";
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    super();
    this.apiKey = process.env.CARD_PAYMENT_API_KEY!;
    this.baseUrl = process.env.CARD_PAYMENT_BASE_URL!;
  }

  async createOrder(orderData: PaymentOrderData): Promise<PaymentResult> {
    try {
      // In real implementation, integrate with payment gateway
      const mockPaymentResponse = {
        id: `card_pay_${Date.now()}`,
        status: 'pending',
        payment_url: `${this.baseUrl}/pay/${Date.now()}`,
        requires_3ds: true
      };

      return {
        success: true,
        paymentId: mockPaymentResponse.id,
        orderId: `order_${Date.now()}`,
        data: mockPaymentResponse
      };
    } catch (error) {
    sentryTracker(error, { source: "card.service" });
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  async capturePayment(paymentId: string, cardData?: any): Promise<PaymentResult> {
    try {
      if (cardData && !this.validateCardData(cardData)) {
        return {
          success: false,
          error: 'Invalid card data'
        };
      }

      const mockCaptureResponse = {
        id: paymentId,
        status: 'completed',
        transaction_id: `txn_${Date.now()}`,
        amount: cardData?.amount || 0,
        captured_at: new Date().toISOString()
      };

      return {
        success: true,
        paymentId: mockCaptureResponse.transaction_id,
        data: mockCaptureResponse
      };
    } catch (error) {
    sentryTracker(error, { source: "card.service" });
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  validatePayment(data: any): boolean {
    return this.validatePaymentData(data);
  }

  private validateCardData(cardData: any): boolean {
    if (!cardData) return false;
    
    const { cardNumber, expiryMonth, expiryYear, cvv, cardholderName } = cardData;
    
    if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) return false;
    if (!expiryMonth || !expiryYear) return false;
    if (!cvv || (cvv.length !== 3 && cvv.length !== 4)) return false;
    if (!cardholderName) return false;

    return true;
  }

  // Card tokenization
  async tokenizeCard(cardData: any) {
    try {
      const token = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        token: token,
        card_type: this.detectCardType(cardData.cardNumber)
      };
    } catch (error) {
    sentryTracker(error, { source: "card.service" });
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  private detectCardType(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    
    if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(cleaned)) return 'VISA';
    if (/^5[1-5][0-9]{14}$/.test(cleaned)) return 'MASTERCARD';
    if (/^3[47][0-9]{13}$/.test(cleaned)) return 'AMEX';
    if (/^6(?:011|5[0-9]{2})[0-9]{12}$/.test(cleaned)) return 'DISCOVER';
    
    return 'UNKNOWN';
  }

  // Card-specific methods
  isClientSecretBased(): boolean {
    return false; // Direct card payments usually don't use client secret
  }
}