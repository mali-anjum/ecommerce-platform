// services/payment/paypal.service.ts
import {
  PaymentMethod,
  PaymentOrderData,
  PaymentResult,
} from "../../interfaces/payment.interface";
import {
  PayPalAccessTokenResponse,
  PayPalOrderResponse,
  PayPalCaptureResponse,
  PayPalWebhookVerificationResponse,
  PayPalItem,
} from "../../interfaces/paypal.interface.response";
import axios, { AxiosResponse, AxiosError } from "axios";
import { v4 as uuidv4 } from "uuid";
import { getErrorMessage } from "../../../utils/catchError";
import { BasePaymentService } from "../base.payment.service";
import { sentryTracker } from "../../../lib/monitoring";

export class PayPalService extends BasePaymentService {
  protected providerName = "PAYPAL";
  private clientId: string;
  private clientSecret: string;
  private baseApi: string;
  private readonly timeout: number = 10000;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    super();
    this.clientId = process.env.PAYPAL_CLIENT_ID || "";
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";
    this.baseApi =
      process.env.PAYPAL_MODE === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";
    this.validateConfiguration();
  }

  /**
   * Orders/capture only need client credentials. Webhook verification
   * additionally requires PAYPAL_WEBHOOK_ID (checked in verifyWebhookSignature).
   */
  private validateConfiguration(): void {
    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        "PayPal configuration missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET"
      );
    }
  }

  private async getAccessToken(): Promise<string> {
    if (
      this.accessToken &&
      this.tokenExpiry &&
      Date.now() < this.tokenExpiry - 60000
    ) {
      return this.accessToken;
    }

    const base64Auth = Buffer.from(
      `${this.clientId}:${this.clientSecret}`
    ).toString("base64");

    try {
      const response: AxiosResponse<PayPalAccessTokenResponse> =
        await axios.post(
          `${this.baseApi}/v1/oauth2/token`,
          "grant_type=client_credentials",
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${base64Auth}`,
            },
            timeout: this.timeout,
          }
        );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + response.data.expires_in * 1000;
      return this.accessToken;
    } catch (error) {
    sentryTracker(error, { source: "paypal.service" });
      this.accessToken = null;
      this.tokenExpiry = null;
      throw new Error(
        `Failed to get PayPal access token: ${getErrorMessage(error)}`
      );
    }
  }

  private async makePayPalRequest<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    url: string,
    data?: any,
    retryCount: number = 0
  ): Promise<AxiosResponse<T>> {
    const accessToken = await this.getAccessToken();
    const startTime = Date.now();
    const requestId = uuidv4();

    try {
      const response = await axios({
        method,
        url,
        data,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "PayPal-Request-ID": requestId,
          "User-Agent": "Ecommerce-Platform/1.0",
        },
        timeout: this.timeout,
      });

      console.log(
        `PayPal API ${method} ${url}: ${
          Date.now() - startTime
        }ms - RequestID: ${requestId}`
      );

      return response;
    } catch (error) {
    sentryTracker(error, { source: "paypal.service" });
      const axiosError = error as AxiosError;

      console.error(`PayPal API Error ${method} ${url}:`, {
        status: axiosError.response?.status,
        message: axiosError.message,
        requestId,
        duration: Date.now() - startTime,
      });

      if (
        retryCount < 2 &&
        (!axiosError.response ||
          (axiosError.response.status >= 500 &&
            axiosError.response.status < 600))
      ) {
        console.log(`Retrying PayPal request (${retryCount + 1}/2)...`);
        await this.delay(1000 * (retryCount + 1));
        return this.makePayPalRequest<T>(method, url, data, retryCount + 1);
      }

      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async createOrder(orderData: PaymentOrderData): Promise<PaymentResult> {
    try {
      if (!this.validatePaymentData(orderData)) {
        return {
          success: false,
          error: "Invalid payment data",
        };
      }

      const calculatedTotal = this.calculateItemTotal(orderData.items);
      const tolerance = 0.01;

      if (Math.abs(calculatedTotal - orderData.total) > tolerance) {
        return {
          success: false,
          error: `Item total (${calculatedTotal}) does not match order total (${orderData.total})`,
        };
      }

      const returnUrl = process.env.PAYPAL_RETURN_URL?.trim();
      const cancelUrl = process.env.PAYPAL_CANCEL_URL?.trim();
      if (!returnUrl || !cancelUrl) {
        return {
          success: false,
          error:
            "PayPal redirect URLs are not configured. Set PAYPAL_RETURN_URL and PAYPAL_CANCEL_URL to your real site (e.g. http://localhost:3012/paypal/return and http://localhost:3012/paypal/cancel for local dev).",
        };
      }

      const checkoutLocale =
        process.env.PAYPAL_LOCALE?.trim() || "en-US";

      // Use PayPalItem type
      const paypalItems: PayPalItem[] = orderData.items.map((item) => ({
        name: item.productName.substring(0, 127),
        description: (item.productName || "").substring(0, 127),
        sku: item.productId.substring(0, 127),
        unit_amount: {
          currency_code: "USD",
          value: Math.max(0, item.price).toFixed(2),
        },
        quantity: Math.max(1, Math.min(item.quantity, 1000000)).toString(),
        category: "PHYSICAL_GOODS",
      }));

      // Use PayPalOrderResponse type
      const brandName = process.env.APP_NAME || "Ecommerce Store";

      const response = await this.makePayPalRequest<PayPalOrderResponse>(
        "POST",
        `${this.baseApi}/v2/checkout/orders`,
        {
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: orderData.total.toFixed(2),
                breakdown: {
                  item_total: {
                    currency_code: "USD",
                    value: calculatedTotal.toFixed(2),
                  },
                },
              },
              items: paypalItems,
            },
          ],
          // Redirect URLs + legacy context (locale here is deprecated by PayPal).
          application_context: {
            brand_name: brandName,
            user_action: "PAY_NOW",
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
          // Preferred place for checkout language + payer experience (see PayPal Orders API).
          payment_source: {
            paypal: {
              experience_context: {
                brand_name: brandName,
                locale: checkoutLocale,
                landing_page: "LOGIN",
                shipping_preference: "GET_FROM_FILE",
                user_action: "PAY_NOW",
                return_url: returnUrl,
                cancel_url: cancelUrl,
              },
            },
          },
        }
      );

      // Type-safe link finding
      const approvalLink = response.data.links.find(
        (link) => link.rel === "approve"
      );
      const approvalUrl = approvalLink?.href;

      return {
        success: true,
        paymentId: response.data.id,
        orderId: response.data.id,
        data: response.data,
        approvalUrl,
      };
    } catch (error) {
    sentryTracker(error, { source: "paypal.service" });
      // PayPal returns helpful details (debug_id, details[].issue). Surface those so
      // the API client can fix misconfiguration/payload issues quickly.
      return {
        success: false,
        error: this.describePayPalError(error),
      };
    }
  }

  /** Extract PayPal REST `details[].issue` codes from an Axios error body. */
  private parsePayPalIssueCodes(error: unknown): string[] {
    const ax = error as AxiosError<{
      details?: Array<{ issue?: string }>;
      message?: string;
    }>;
    const details = ax.response?.data?.details;
    if (!Array.isArray(details)) return [];
    return details
      .map((d) => d.issue)
      .filter((x): x is string => typeof x === "string" && x.length > 0);
  }

  /** Build useful API-facing message from PayPal error response payload. */
  private describePayPalError(error: unknown): string {
    const ax = error as AxiosError<{
      name?: string;
      message?: string;
      debug_id?: string;
      details?: Array<{ issue?: string; description?: string }>;
    }>;
    const payload = ax.response?.data;
    if (!payload) return getErrorMessage(error);

    const issues = (payload.details ?? [])
      .map((d) => d.issue)
      .filter((v): v is string => typeof v === "string" && v.length > 0);
    const issuePart = issues.length > 0 ? ` [${issues.join(", ")}]` : "";
    const debugPart =
      typeof payload.debug_id === "string" && payload.debug_id.length > 0
        ? ` (debug_id: ${payload.debug_id})`
        : "";
    return `${payload.name ?? "PayPalError"}: ${payload.message ?? "Request failed"}${issuePart}${debugPart}`;
  }

  async capturePayment(paymentId: string): Promise<PaymentResult> {
    try {
      if (!paymentId || typeof paymentId !== "string") {
        return {
          success: false,
          error: "Valid paymentId is required",
        };
      }

      try {
        const response = await this.makePayPalRequest<PayPalCaptureResponse>(
          "POST",
          `${this.baseApi}/v2/checkout/orders/${paymentId}/capture`,
          {}
        );

        const isSuccessful = response.data.status === "COMPLETED";

        const captureId =
          response.data.purchase_units?.[0]?.payments?.captures?.[0]?.id;

        return {
          success: isSuccessful,
          paymentId: captureId || response.data.id,
          orderId: paymentId,
          captureId,
          data: response.data,
          ...(isSuccessful
            ? {}
            : { error: `Capture status: ${response.data.status}` }),
        };
      } catch (error) {
    sentryTracker(error, { source: "paypal.service" });
        const issues = this.parsePayPalIssueCodes(error);
        const alreadyCaptured =
          issues.includes("ORDER_ALREADY_CAPTURED") ||
          issues.includes("CANNOT_CAPTURE_COMPLETED_ORDER");

        if (alreadyCaptured) {
          const detailsResult = await this.getOrderDetails(paymentId);
          const orderData = detailsResult.data as PayPalCaptureResponse & {
            status?: string;
          };
          if (
            detailsResult.success &&
            orderData?.status === "COMPLETED"
          ) {
            const captureId =
              orderData.purchase_units?.[0]?.payments?.captures?.[0]?.id;
            return {
              success: true,
              paymentId: captureId || orderData.id,
              orderId: paymentId,
              captureId,
              data: orderData,
            };
          }
        }

        return {
          success: false,
          error: this.describePayPalError(error),
        };
      }
    } catch (error) {
    sentryTracker(error, { source: "paypal.service" });
      return {
        success: false,
        error: this.describePayPalError(error),
      };
    }
  }

  async getOrderDetails(paymentId: string): Promise<PaymentResult> {
    try {
      // Use PayPalOrderResponse type
      const response = await this.makePayPalRequest<PayPalOrderResponse>(
        "GET",
        `${this.baseApi}/v2/checkout/orders/${paymentId}`
      );

      return {
        success: true,
        paymentId: response.data.id,
        orderId: response.data.id,
        data: response.data,
      };
    } catch (error) {
    sentryTracker(error, { source: "paypal.service" });
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  validatePayment(data: any): boolean {
    return this.validatePaymentData(data);
  }

  async verifyWebhookSignature(
    rawBody: string,
    transmissionSig: string,
    timestamp: string,
    certUrl: string,
    transmissionId?: string
  ): Promise<boolean> {
    try {
      const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
      if (!webhookId) {
        console.error(
          "PayPal webhook verification requires PAYPAL_WEBHOOK_ID to be set"
        );
        return false;
      }

      if (!transmissionSig || !timestamp || !certUrl || !transmissionId) {
        console.error(
          "Webhook verification failed: Missing required parameters"
        );
        return false;
      }

      // Parse the raw body
      const body = JSON.parse(rawBody);
      
      // Validate certificate URL to prevent SSRF attacks
      if (!this.isValidPayPalCertUrl(certUrl)) {
        console.error(
          `Webhook verification failed: Invalid certificate URL: ${certUrl}`
        );
        return false;
      }

      // Use PayPalWebhookVerificationResponse type
      const response = await this.makePayPalRequest<PayPalWebhookVerificationResponse>(
        "POST",
        `${this.baseApi}/v1/notifications/verify-webhook-signature`,
        {
          transmission_id: transmissionId,
          transmission_time: timestamp,
          transmission_sig: transmissionSig,
          cert_url: certUrl,
          auth_algo: "SHA256withRSA",
          webhook_id: webhookId,
          webhook_event: body,
        }
      );

      return response.data.verification_status === "SUCCESS";
    } catch (error) {
    sentryTracker(error, { source: "paypal.service" });
      console.error("PayPal webhook verification failed:", {
        error: getErrorMessage(error),
        transmissionId,
        timestamp,
      });
      return false;
    }
  }

  private isValidPayPalCertUrl(url: string): boolean {
    const validDomains = [
      "api-m.paypal.com",
      "api-m.sandbox.paypal.com",
      "www.paypal.com",
      "www.sandbox.paypal.com",
    ];

    try {
      const certUrl = new URL(url);
      return validDomains.includes(certUrl.hostname);
    } catch {
      return false;
    }
  }

  async handleWebhook(payload: any, signature: string): Promise<any> {
    try {
      const event = JSON.parse(payload);
      const eventType = event.event_type;

      switch (eventType) {
        case "CHECKOUT.ORDER.APPROVED":
          return { success: true, event: "order_approved", data: event };
        case "PAYMENT.CAPTURE.COMPLETED":
          return { success: true, event: "payment_captured", data: event };
        case "PAYMENT.CAPTURE.DENIED":
        case "PAYMENT.CAPTURE.FAILED":
          return { success: false, event: "payment_failed", data: event };
        default:
          return { success: true, event: "unknown", data: event };
      }
    } catch (error) {
    sentryTracker(error, { source: "paypal.service" });
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // PayPal-specific methods
  isRedirectBased(): boolean {
    return true;
  }

  // Utility method to clear cached token (useful for testing)
  clearTokenCache(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
  }
}