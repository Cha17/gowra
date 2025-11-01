import type { 
  CreatePaymentIntentRequest, 
  PaymentIntentResponse, 
  PaymentIntentStatus 
} from "./types";
import type { DatabaseClient } from "../../db/types";
import type { Logger } from "./http-client";
import { NextPayClientImpl } from "./client";

/**
 * Payment Processing Service handles payment operations for event registrations
 */
export class PaymentProcessingService {
  constructor(
    private nextpayClient: NextPayClientImpl,
    private db: DatabaseClient,
    private logger: Logger
  ) {}

  /**
   * Creates a payment intent for an event registration
   * @param registrationId - Registration ID
   * @param userId - User ID
   * @returns Payment intent with QR code
   */
  async createPaymentIntentForRegistration(
    registrationId: string,
    userId: string
  ): Promise<PaymentIntentResponse> {
    this.logger.info("Creating payment intent for registration", { 
      registrationId, 
      userId 
    });

    try {
      // Get registration details
      const registration = await this.getRegistrationDetails(registrationId);
      
      if (!registration) {
        throw new Error("Registration not found");
      }

      // Check if user owns this registration
      if (registration.user_id !== userId) {
        throw new Error("Unauthorized access to registration");
      }

      // Check if payment is already completed
      if (registration.payment_status === "paid") {
        throw new Error("Registration already paid");
      }

      // Check if payment intent already exists
      const existingIntent = await this.getExistingPaymentIntent(registrationId);
      if (existingIntent && existingIntent.status === "PENDING") {
        this.logger.info("Payment intent already exists", { 
          registrationId,
          intentId: existingIntent.id 
        });
        return existingIntent;
      }

      // Get or create user's NextPay account
      const account = await this.ensureUserAccount(userId, registration);

      // Create order for the registration
      const order = await this.createOrderForRegistration(registration);

      // Create payment intent
      const paymentIntent = await this.nextpayClient.createOrderPaymentIntent(order.id, {
        accountId: account.id,
        amount: parseFloat(registration.payment_amount),
        currency: "PHP",
        description: `Event Registration: ${registration.event_name}`,
        orderId: order.id,
        metadata: {
          registrationId,
          eventId: registration.event_id,
          userId,
        }
      });

      // Update registration with payment reference
      await this.updateRegistrationPaymentReference(registrationId, paymentIntent.id);

      this.logger.info("Payment intent created successfully", { 
        registrationId,
        intentId: paymentIntent.id,
        orderId: order.id,
        hasQrCode: !!paymentIntent.qrCode
      });

      return paymentIntent;
    } catch (error) {
      this.logger.error("Failed to create payment intent for registration", { 
        error: error instanceof Error ? error.message : String(error),
        registrationId,
        userId 
      });
      throw error;
    }
  }

  /**
   * Gets payment status for a registration
   * @param registrationId - Registration ID
   * @param userId - User ID
   * @returns Payment status information
   */
  async getPaymentStatus(
    registrationId: string,
    userId: string
  ): Promise<{
    status: PaymentIntentStatus;
    qrCode?: string;
    amount: number;
    currency: string;
    expiresAt?: string;
    lastUpdated: string;
  }> {
    this.logger.info("Getting payment status", { registrationId, userId });

    try {
      // Get registration details
      const registration = await this.getRegistrationDetails(registrationId);
      
      if (!registration) {
        throw new Error("Registration not found");
      }

      // Check if user owns this registration
      if (registration.user_id !== userId) {
        throw new Error("Unauthorized access to registration");
      }

      // Get payment intent
      const paymentIntent = await this.getExistingPaymentIntent(registrationId);
      
      if (!paymentIntent) {
        return {
          status: "PENDING" as PaymentIntentStatus,
          amount: parseFloat(registration.payment_amount),
          currency: "PHP",
          lastUpdated: registration.created_at
        };
      }

      // Get latest payment intent status from NextPay
      const latestIntent = await this.nextpayClient.getPaymentIntent(paymentIntent.intent_id);

      // Update local payment intent status if changed
      if (latestIntent.status !== paymentIntent.status) {
        await this.nextpayClient.updatePaymentIntentStatus(
          paymentIntent.intent_id, 
          latestIntent.status
        );
      }

      return {
        status: latestIntent.status,
        qrCode: latestIntent.qrCode,
        amount: latestIntent.amount,
        currency: latestIntent.currency,
        expiresAt: latestIntent.expiresAt,
        lastUpdated: latestIntent.updatedAt
      };
    } catch (error) {
      this.logger.error("Failed to get payment status", { 
        error: error instanceof Error ? error.message : String(error),
        registrationId,
        userId 
      });
      throw error;
    }
  }

  /**
   * Retries a failed payment for a registration
   * @param registrationId - Registration ID
   * @param userId - User ID
   * @returns New payment intent with QR code
   */
  async retryPayment(
    registrationId: string,
    userId: string
  ): Promise<PaymentIntentResponse> {
    this.logger.info("Retrying payment for registration", { registrationId, userId });

    try {
      // Get current payment status
      const currentStatus = await this.getPaymentStatus(registrationId, userId);
      
      if (currentStatus.status === "COMPLETED") {
        throw new Error("Payment already completed");
      }

      if (currentStatus.status === "PROCESSING") {
        throw new Error("Payment is currently being processed");
      }

      // Create new payment intent
      return await this.createPaymentIntentForRegistration(registrationId, userId);
    } catch (error) {
      this.logger.error("Failed to retry payment", { 
        error: error instanceof Error ? error.message : String(error),
        registrationId,
        userId 
      });
      throw error;
    }
  }

  /**
   * Gets registration details with event information
   * @param registrationId - Registration ID
   * @returns Registration details
   */
  private async getRegistrationDetails(registrationId: string): Promise<any> {
    const registration = await this.db
      .selectFrom("registrations")
      .innerJoin("events", "events.id", "registrations.event_id")
      .select([
        "registrations.id",
        "registrations.user_id",
        "registrations.event_id",
        "registrations.payment_status",
        "registrations.payment_amount",
        "registrations.created_at",
        "events.name as event_name"
      ])
      .where("registrations.id", "=", registrationId)
      .executeTakeFirst();

    return registration;
  }

  /**
   * Gets existing payment intent for a registration
   * @param registrationId - Registration ID
   * @returns Payment intent or null
   */
  private async getExistingPaymentIntent(registrationId: string): Promise<any> {
    // First get the order for this registration
    const order = await this.db
      .selectFrom("orders")
      .select("id")
      .where("event_id", "=", (await this.getRegistrationDetails(registrationId))?.event_id)
      .executeTakeFirst();

    if (!order) {
      return null;
    }

    // Get payment intent for the order
    const paymentIntent = await this.db
      .selectFrom("payment_intents")
      .selectAll()
      .where("order_id", "=", order.id)
      .executeTakeFirst();

    return paymentIntent;
  }

  /**
   * Ensures user has a NextPay account reference in our database
   * Note: NextPay doesn't require account creation - we just track it locally
   * @param userId - User ID
   * @param registration - Registration details
   * @returns Account reference with a mock account ID
   */
  private async ensureUserAccount(userId: string, registration: any): Promise<any> {
    // Check if user already has an account reference in our database
    let account = await this.db
      .selectFrom("user_accounts")
      .selectAll()
      .where("user_id", "=", userId)
      .executeTakeFirst();
    
    if (!account) {
      // Get user details
      const user = await this.db
        .selectFrom("users")
        .select(["name", "email"])
        .where("id", "=", userId)
        .executeTakeFirst();

      if (!user) {
        throw new Error("User not found");
      }

      // Create a local account reference (NextPay doesn't require account creation)
      // We use the user ID as the account ID for simplicity
      const accountId = userId;
      
      await this.db
        .insertInto("user_accounts")
        .values({
          user_id: userId,
          account_id: accountId,
        })
        .execute();
      
      account = await this.db
        .selectFrom("user_accounts")
        .selectAll()
        .where("user_id", "=", userId)
        .executeTakeFirst();
    }

    if (!account) {
      throw new Error("Failed to create or retrieve account");
    }

    return { id: account.account_id };
  }

  /**
   * Creates an order for a registration
   * @param registration - Registration details
   * @returns Created order
   */
  private async createOrderForRegistration(registration: any): Promise<any> {
    // Check if order already exists
    const existingOrder = await this.db
      .selectFrom("orders")
      .selectAll()
      .where("event_id", "=", registration.event_id)
      .where("user_id", "=", registration.user_id)
      .executeTakeFirst();

    if (existingOrder) {
      return existingOrder;
    }

    // Create new order
    const order = await this.db
      .insertInto("orders")
      .values({
        event_id: registration.event_id,
        user_id: registration.user_id,
        total_amount: Math.round(parseFloat(registration.payment_amount) * 100), // Convert to cents
        currency: "PHP",
        status: "pending",
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirst();

    if (!order) {
      throw new Error("Failed to create order");
    }

    return order;
  }

  /**
   * Updates registration with payment reference
   * @param registrationId - Registration ID
   * @param paymentIntentId - Payment intent ID
   */
  private async updateRegistrationPaymentReference(
    registrationId: string,
    paymentIntentId: string
  ): Promise<void> {
    await this.db
      .updateTable("registrations")
      .set({
        payment_reference: paymentIntentId,
      })
      .where("id", "=", registrationId)
      .execute();
  }
}
