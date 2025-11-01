import type { 
  PaymentIntentStatus 
} from "./types";
import type { DatabaseClient } from "../../db/types";
import type { Logger } from "./http-client";
import { NextPayClientImpl } from "./client";

/**
 * Payment Status Tracking Service handles real-time payment status updates
 */
export class PaymentStatusTrackingService {
  constructor(
    private nextpayClient: NextPayClientImpl,
    private db: DatabaseClient,
    private logger: Logger
  ) {}

  /**
   * Polls payment status from NextPay API
   * @param paymentIntentId - Payment intent ID
   * @returns Updated payment status
   */
  async pollPaymentStatus(paymentIntentId: string): Promise<{
    status: PaymentIntentStatus;
    lastUpdated: string;
    hasChanged: boolean;
  }> {
    this.logger.debug("Polling payment status", { paymentIntentId });

    try {
      // Get current status from database
      const currentIntent = await this.db
        .selectFrom("payment_intents")
        .selectAll()
        .where("intent_id", "=", paymentIntentId)
        .executeTakeFirst();

      if (!currentIntent) {
        throw new Error("Payment intent not found");
      }

      // Get latest status from NextPay API
      const latestIntent = await this.nextpayClient.getPaymentIntent(paymentIntentId);
      
      const hasChanged = latestIntent.status !== currentIntent.status;
      
      if (hasChanged) {
        // Update database with new status
        await this.updatePaymentIntentStatus(paymentIntentId, latestIntent.status);
        
        // Update related records if payment is completed
        if (latestIntent.status === "COMPLETED") {
          await this.handlePaymentCompletion(paymentIntentId);
        }
        
        this.logger.info("Payment status updated", { 
          paymentIntentId,
          oldStatus: currentIntent.status,
          newStatus: latestIntent.status
        });
      }

      return {
        status: latestIntent.status,
        lastUpdated: latestIntent.updatedAt,
        hasChanged
      };
    } catch (error) {
      this.logger.error("Failed to poll payment status", { 
        error: error instanceof Error ? error.message : String(error),
        paymentIntentId 
      });
      throw error;
    }
  }

  /**
   * Gets payment status for a registration
   * @param registrationId - Registration ID
   * @returns Payment status information
   */
  async getRegistrationPaymentStatus(registrationId: string): Promise<{
    registrationId: string;
    paymentStatus: string;
    paymentIntentStatus?: PaymentIntentStatus;
    amount: number;
    currency: string;
    lastUpdated: string;
    qrCode?: string;
    expiresAt?: string;
  }> {
    this.logger.debug("Getting registration payment status", { registrationId });

    try {
      // Get registration details
      const registration = await this.db
        .selectFrom("registrations")
        .selectAll()
        .where("id", "=", registrationId)
        .executeTakeFirst();

      if (!registration) {
        throw new Error("Registration not found");
      }

      // Get payment intent if exists
      const paymentIntent = await this.getPaymentIntentForRegistration(registrationId);
      
      let paymentIntentStatus: PaymentIntentStatus | undefined;
      let qrCode: string | undefined;
      let expiresAt: string | undefined;
      let lastUpdated = registration.created_at;

      if (paymentIntent) {
        paymentIntentStatus = paymentIntent.status as PaymentIntentStatus;
        qrCode = paymentIntent.qr_code;
        expiresAt = paymentIntent.expires_at;
        lastUpdated = paymentIntent.updated_at;
      }

      return {
        registrationId,
        paymentStatus: registration.payment_status,
        paymentIntentStatus,
        amount: parseFloat(registration.payment_amount),
        currency: "PHP",
        lastUpdated,
        qrCode,
        expiresAt
      };
    } catch (error) {
      this.logger.error("Failed to get registration payment status", { 
        error: error instanceof Error ? error.message : String(error),
        registrationId 
      });
      throw error;
    }
  }

  /**
   * Updates payment intent status in database
   * @param paymentIntentId - Payment intent ID
   * @param status - New status
   */
  private async updatePaymentIntentStatus(
    paymentIntentId: string,
    status: PaymentIntentStatus
  ): Promise<void> {
    await this.db
      .updateTable("payment_intents")
      .set({
        status,
        updated_at: new Date(),
      })
      .where("intent_id", "=", paymentIntentId)
      .execute();
  }

  /**
   * Handles payment completion by updating related records
   * @param paymentIntentId - Payment intent ID
   */
  private async handlePaymentCompletion(paymentIntentId: string): Promise<void> {
    this.logger.info("Handling payment completion", { paymentIntentId });

    try {
      // Get payment intent details
      const paymentIntent = await this.db
        .selectFrom("payment_intents")
        .selectAll()
        .where("intent_id", "=", paymentIntentId)
        .executeTakeFirst();

      if (!paymentIntent) {
        throw new Error("Payment intent not found");
      }

      // Update order status
      await this.db
        .updateTable("orders")
        .set({
          status: "paid",
          updated_at: new Date(),
        })
        .where("id", "=", paymentIntent.order_id)
        .execute();

      // Update registration payment status
      const order = await this.db
        .selectFrom("orders")
        .select("event_id")
        .where("id", "=", paymentIntent.order_id)
        .executeTakeFirst();

      if (order) {
        await this.db
          .updateTable("registrations")
          .set({
            payment_status: "paid",
            updated_at: new Date(),
          })
          .where("event_id", "=", order.event_id)
          .where("user_id", "=", paymentIntent.user_id)
          .execute();
      }

      this.logger.info("Payment completion handled successfully", { 
        paymentIntentId,
        orderId: paymentIntent.order_id
      });
    } catch (error) {
      this.logger.error("Failed to handle payment completion", { 
        error: error instanceof Error ? error.message : String(error),
        paymentIntentId 
      });
      throw error;
    }
  }

  /**
   * Gets payment intent for a registration
   * @param registrationId - Registration ID
   * @returns Payment intent or null
   */
  private async getPaymentIntentForRegistration(registrationId: string): Promise<any> {
    // Get registration details
    const registration = await this.db
      .selectFrom("registrations")
      .select("event_id")
      .where("id", "=", registrationId)
      .executeTakeFirst();

    if (!registration) {
      return null;
    }

    // Get order for this registration
    const order = await this.db
      .selectFrom("orders")
      .select("id")
      .where("event_id", "=", registration.event_id)
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
   * Gets all pending payments that need status updates
   * @returns List of pending payment intents
   */
  async getPendingPayments(): Promise<Array<{
    intentId: string;
    orderId: string;
    lastUpdated: string;
    expiresAt: string;
  }>> {
    this.logger.debug("Getting pending payments");

    try {
      const pendingIntents = await this.db
        .selectFrom("payment_intents")
        .select([
          "intent_id",
          "order_id",
          "updated_at",
          "expires_at"
        ])
        .where("status", "=", "PENDING")
        .execute();

      return pendingIntents.map(intent => ({
        intentId: intent.intent_id,
        orderId: intent.order_id,
        lastUpdated: intent.updated_at,
        expiresAt: intent.expires_at
      }));
    } catch (error) {
      this.logger.error("Failed to get pending payments", { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Batch updates payment statuses for multiple intents
   * @param intentIds - Array of payment intent IDs
   * @returns Update results
   */
  async batchUpdatePaymentStatuses(intentIds: string[]): Promise<Array<{
    intentId: string;
    status: PaymentIntentStatus;
    hasChanged: boolean;
    error?: string;
  }>> {
    this.logger.info("Batch updating payment statuses", { count: intentIds.length });

    const results = await Promise.allSettled(
      intentIds.map(async (intentId) => {
        try {
          const result = await this.pollPaymentStatus(intentId);
          return {
            intentId,
            status: result.status,
            hasChanged: result.hasChanged
          };
        } catch (error) {
          return {
            intentId,
            status: "FAILED" as PaymentIntentStatus,
            hasChanged: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      })
    );

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          intentId: intentIds[index],
          status: "FAILED" as PaymentIntentStatus,
          hasChanged: false,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason)
        };
      }
    });
  }
}
