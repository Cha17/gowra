import type { 
  CreatePaymentIntentRequest, 
  PaymentIntentResponse, 
  PaymentIntentStatus,
  NextPayClient 
} from "./types";
import type { DatabaseClient } from "../../db/types";
import type { Logger } from "./http-client";

/**
 * NextPay Payment Intent Service handles payment intent operations
 */
export class NextPayPaymentIntentService {
  constructor(
    private client: NextPayClient,
    private db: DatabaseClient,
    private logger: Logger
  ) {}

  /**
   * Creates a payment intent for QR code generation
   * @param orderId - Order ID
   * @param intentData - Payment intent data
   * @returns Payment intent with QR code
   */
  async createPaymentIntent(
    orderId: string,
    intentData: CreatePaymentIntentRequest
  ): Promise<PaymentIntentResponse> {
    this.logger.info("Creating payment intent", { 
      orderId,
      accountId: intentData.accountId,
      amount: intentData.amount,
      currency: intentData.currency,
    });

    // Validate payment intent data
    this.validatePaymentIntentData(intentData);

    // Check if order exists and is valid
    const order = await this.validateOrder(orderId);

    // Check if payment intent already exists for this order
    const existingIntent = await this.getPaymentIntentByOrderId(orderId);
    if (existingIntent && existingIntent.status === "PENDING") {
      this.logger.info("Payment intent already exists for order", { 
        orderId,
        intentId: existingIntent.id 
      });
      return existingIntent;
    }

    try {
      // Create payment intent via NextPay API
      const intentResponse = await this.client.createPaymentIntent(intentData);

      // Store payment intent in database
      await this.storePaymentIntent(orderId, intentResponse);

      // Update order status (keep as pending since payment not completed yet)
      await this.updateOrderStatus(orderId, "pending");

      this.logger.info("Payment intent created successfully", { 
        orderId,
        intentId: intentResponse.id,
        status: intentResponse.status,
        hasQrCode: !!intentResponse.qrCode
      });

      return intentResponse;
    } catch (error) {
      this.logger.error("Failed to create payment intent", { 
        error: error instanceof Error ? error.message : String(error),
        orderId,
        accountId: intentData.accountId
      });
      throw error;
    }
  }

  /**
   * Retrieves payment intent information by intent ID
   * @param intentId - Payment intent ID
   * @returns Payment intent information
   */
  async getPaymentIntent(intentId: string): Promise<PaymentIntentResponse> {
    this.logger.info("Retrieving payment intent", { intentId });

    try {
      const paymentIntent = await this.client.getPaymentIntent(intentId);
      
      this.logger.info("Payment intent retrieved successfully", { 
        intentId: paymentIntent.id,
        status: paymentIntent.status 
      });
      
      return paymentIntent;
    } catch (error) {
      this.logger.error("Failed to retrieve payment intent", { 
        error: error instanceof Error ? error.message : String(error),
        intentId 
      });
      throw error;
    }
  }

  /**
   * Retrieves payment intent information by order ID
   * @param orderId - Order ID
   * @returns Payment intent information or null if not found
   */
  async getPaymentIntentByOrderId(orderId: string): Promise<PaymentIntentResponse | null> {
    this.logger.info("Retrieving payment intent by order ID", { orderId });

    try {
      const intentRef = await this.db
        .selectFrom("payment_intents")
        .selectAll()
        .where("order_id", "=", orderId)
        .executeTakeFirst();

      if (!intentRef) {
        this.logger.info("No payment intent found for order", { orderId });
        return null;
      }

      const paymentIntent = await this.getPaymentIntent(intentRef.intent_id);
      
      this.logger.info("Payment intent retrieved by order ID", { 
        orderId,
        intentId: paymentIntent.id,
        status: paymentIntent.status 
      });
      
      return paymentIntent;
    } catch (error) {
      this.logger.error("Failed to retrieve payment intent by order ID", { 
        error: error instanceof Error ? error.message : String(error),
        orderId 
      });
      throw error;
    }
  }

  /**
   * Updates payment intent status in database
   * @param intentId - Payment intent ID
   * @param status - New status
   */
  async updatePaymentIntentStatus(
    intentId: string,
    status: PaymentIntentStatus
  ): Promise<void> {
    this.logger.info("Updating payment intent status", { intentId, status });

    try {
      await this.db
        .updateTable("payment_intents")
        .set({
          status,
          updated_at: new Date(),
        })
        .where("intent_id", "=", intentId)
        .execute();

      this.logger.info("Payment intent status updated", { intentId, status });
    } catch (error) {
      this.logger.error("Failed to update payment intent status", { 
        error: error instanceof Error ? error.message : String(error),
        intentId, 
        status 
      });
      throw error;
    }
  }

  /**
   * Validates payment intent creation data
   * @param data - Payment intent data to validate
   * @throws Error if validation fails
   */
  private validatePaymentIntentData(data: CreatePaymentIntentRequest): void {
    if (!data.accountId || !data.amount || !data.currency || !data.description) {
      throw new Error("Required fields missing: accountId, amount, currency, description");
    }

    if (data.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    if (data.currency !== "PHP") {
      throw new Error("Only PHP currency is supported");
    }

    if (data.description.trim().length < 3) {
      throw new Error("Description must be at least 3 characters long");
    }

    if (data.orderId && data.orderId.trim().length === 0) {
      throw new Error("Order ID cannot be empty");
    }
  }

  /**
   * Validates that order exists and is valid for payment
   * @param orderId - Order ID to validate
   * @returns Order information
   * @throws Error if order is invalid
   */
  private async validateOrder(orderId: string): Promise<any> {
    try {
      const order = await this.db
        .selectFrom("orders")
        .selectAll()
        .where("id", "=", orderId)
        .executeTakeFirst();

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.status === "paid") {
        throw new Error("Order already paid");
      }

      if (order.status === "cancelled") {
        throw new Error("Cannot create payment intent for cancelled order");
      }

      this.logger.info("Order validated", { 
        orderId,
        status: order.status,
        totalAmount: order.total_amount 
      });

      return order;
    } catch (error) {
      this.logger.error("Order validation failed", { 
        error: error instanceof Error ? error.message : String(error),
        orderId 
      });
      throw error;
    }
  }

  /**
   * Stores payment intent in database
   * @param orderId - Order ID
   * @param intentResponse - Payment intent response from NextPay
   */
  private async storePaymentIntent(
    orderId: string,
    intentResponse: PaymentIntentResponse
  ): Promise<void> {
    try {
      await this.db
        .insertInto("payment_intents")
        .values({
          intent_id: intentResponse.id,
          order_id: orderId,
          account_id: intentResponse.accountId,
          amount: intentResponse.amount.toString(),
          currency: intentResponse.currency,
          status: intentResponse.status,
          qr_code: intentResponse.qrCode,
          expires_at: new Date(intentResponse.expiresAt),
          created_at: new Date(intentResponse.createdAt),
          updated_at: new Date(intentResponse.updatedAt),
        })
        .execute();

      this.logger.info("Payment intent stored", { 
        orderId,
        intentId: intentResponse.id 
      });
    } catch (error) {
      this.logger.error("Failed to store payment intent", { 
        error: error instanceof Error ? error.message : String(error),
        orderId,
        intentId: intentResponse.id 
      });
      throw error;
    }
  }

  /**
   * Updates order status in database
   * @param orderId - Order ID
   * @param status - New status
   */
  private async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      await this.db
        .updateTable("orders")
        .set({
          status: status as any,
          updated_at: new Date(),
        })
        .where("id", "=", orderId)
        .execute();

      this.logger.info("Order status updated", { orderId, status });
    } catch (error) {
      this.logger.error("Failed to update order status", { 
        error: error instanceof Error ? error.message : String(error),
        orderId, 
        status 
      });
      throw error;
    }
  }
}
