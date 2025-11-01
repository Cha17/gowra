import type { 
  PaymentIntentStatus 
} from "./types";
import type { DatabaseClient } from "../../db/types";
import type { Logger } from "./http-client";
import { NextPayClientImpl } from "./client";

/**
 * Payment Retry Service handles retry mechanisms for failed payments
 */
export class PaymentRetryService {
  constructor(
    private nextpayClient: NextPayClientImpl,
    private db: DatabaseClient,
    private logger: Logger
  ) {}

  /**
   * Retries a failed payment by creating a new payment intent
   * @param registrationId - Registration ID
   * @param userId - User ID
   * @param reason - Reason for retry
   * @returns New payment intent
   */
  async retryFailedPayment(
    registrationId: string,
    userId: string,
    reason: string = "Manual retry"
  ): Promise<{
    success: boolean;
    paymentIntent?: any;
    error?: string;
  }> {
    this.logger.info("Retrying failed payment", { 
      registrationId, 
      userId, 
      reason 
    });

    try {
      // Get current payment status
      const currentStatus = await this.getCurrentPaymentStatus(registrationId);
      
      if (!currentStatus) {
        return {
          success: false,
          error: "Registration not found"
        };
      }

      // Check if retry is allowed
      const retryCheck = await this.canRetryPayment(registrationId);
      if (!retryCheck.canRetry) {
        return {
          success: false,
          error: retryCheck.reason
        };
      }

      // Cancel existing payment intent if it exists
      if (currentStatus.paymentIntentId) {
        await this.cancelExistingPaymentIntent(currentStatus.paymentIntentId);
      }

      // Create new payment intent
      const newPaymentIntent = await this.nextpayClient.createOrderPaymentIntent(
        currentStatus.orderId,
        {
          accountId: currentStatus.accountId,
          amount: currentStatus.amount,
          currency: "PHP",
          description: `Event Registration Retry: ${currentStatus.eventName}`,
          orderId: currentStatus.orderId,
          metadata: {
            registrationId,
            eventId: currentStatus.eventId,
            userId,
            retryReason: reason,
            retryAttempt: currentStatus.retryCount + 1
          }
        }
      );

      // Update retry count
      await this.updateRetryCount(registrationId, currentStatus.retryCount + 1);

      // Log retry attempt
      await this.logRetryAttempt(registrationId, reason, "success");

      this.logger.info("Payment retry successful", { 
        registrationId,
        newIntentId: newPaymentIntent.id,
        retryCount: currentStatus.retryCount + 1
      });

      return {
        success: true,
        paymentIntent: newPaymentIntent
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Log failed retry attempt
      await this.logRetryAttempt(registrationId, reason, "failed", errorMessage);

      this.logger.error("Payment retry failed", { 
        error: errorMessage,
        registrationId,
        userId,
        reason
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Checks if a payment can be retried
   * @param registrationId - Registration ID
   * @returns Retry eligibility
   */
  async canRetryPayment(registrationId: string): Promise<{
    canRetry: boolean;
    reason?: string;
    retryCount: number;
    maxRetries: number;
  }> {
    try {
      const retryInfo = await this.getRetryInfo(registrationId);
      
      if (retryInfo.retryCount >= retryInfo.maxRetries) {
        return {
          canRetry: false,
          reason: `Maximum retry attempts (${retryInfo.maxRetries}) exceeded`,
          retryCount: retryInfo.retryCount,
          maxRetries: retryInfo.maxRetries
        };
      }

      if (retryInfo.paymentStatus === "paid") {
        return {
          canRetry: false,
          reason: "Payment already completed",
          retryCount: retryInfo.retryCount,
          maxRetries: retryInfo.maxRetries
        };
      }

      if (retryInfo.paymentStatus === "processing") {
        return {
          canRetry: false,
          reason: "Payment is currently being processed",
          retryCount: retryInfo.retryCount,
          maxRetries: retryInfo.maxRetries
        };
      }

      return {
        canRetry: true,
        retryCount: retryInfo.retryCount,
        maxRetries: retryInfo.maxRetries
      };
    } catch (error) {
      this.logger.error("Failed to check retry eligibility", { 
        error: error instanceof Error ? error.message : String(error),
        registrationId 
      });
      return {
        canRetry: false,
        reason: "Unable to check retry eligibility",
        retryCount: 0,
        maxRetries: 3
      };
    }
  }

  /**
   * Gets retry information for a registration
   * @param registrationId - Registration ID
   * @returns Retry information
   */
  async getRetryInfo(registrationId: string): Promise<{
    retryCount: number;
    maxRetries: number;
    paymentStatus: string;
    lastRetryAt?: string;
    retryHistory: Array<{
      attempt: number;
      reason: string;
      status: string;
      timestamp: string;
      error?: string;
    }>;
  }> {
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

      // Get retry history from payment history
      const retryHistory = await this.db
        .selectFrom("payment_history")
        .selectAll()
        .where("registration_id", "=", registrationId)
        .where("status", "=", "retry")
        .orderBy("created_at", "desc")
        .execute();

      const retryCount = retryHistory.length;
      const maxRetries = 3; // Configurable
      const lastRetryAt = retryHistory[0]?.created_at;

      return {
        retryCount,
        maxRetries,
        paymentStatus: registration.payment_status,
        lastRetryAt,
        retryHistory: retryHistory.map(record => ({
          attempt: retryCount - retryHistory.indexOf(record),
          reason: record.payment_method || "Unknown",
          status: record.status,
          timestamp: record.created_at,
          error: record.status === "failed" ? "Retry failed" : undefined
        }))
      };
    } catch (error) {
      this.logger.error("Failed to get retry info", { 
        error: error instanceof Error ? error.message : String(error),
        registrationId 
      });
      throw error;
    }
  }

  /**
   * Gets current payment status for retry
   * @param registrationId - Registration ID
   * @returns Current payment status
   */
  private async getCurrentPaymentStatus(registrationId: string): Promise<any> {
    const registration = await this.db
      .selectFrom("registrations")
      .innerJoin("events", "events.id", "registrations.event_id")
      .innerJoin("orders", "orders.event_id", "events.id")
      .leftJoin("payment_intents", "payment_intents.order_id", "orders.id")
      .leftJoin("user_accounts", "user_accounts.user_id", "registrations.user_id")
      .select([
        "registrations.id",
        "registrations.user_id",
        "registrations.event_id",
        "registrations.payment_status",
        "registrations.payment_amount",
        "events.name as event_name",
        "orders.id as order_id",
        "payment_intents.intent_id as payment_intent_id",
        "user_accounts.account_id"
      ])
      .where("registrations.id", "=", registrationId)
      .executeTakeFirst();

    if (!registration) {
      return null;
    }

    // Get retry count
    const retryCount = await this.getRetryCount(registrationId);

    return {
      ...registration,
      amount: parseFloat(registration.payment_amount),
      retryCount
    };
  }

  /**
   * Gets retry count for a registration
   * @param registrationId - Registration ID
   * @returns Retry count
   */
  private async getRetryCount(registrationId: string): Promise<number> {
    const retryHistory = await this.db
      .selectFrom("payment_history")
      .select(this.db.fn.count("id").as("count"))
      .where("registration_id", "=", registrationId)
      .where("status", "=", "retry")
      .executeTakeFirst();

    return Number(retryHistory?.count || 0);
  }

  /**
   * Cancels existing payment intent
   * @param paymentIntentId - Payment intent ID
   */
  private async cancelExistingPaymentIntent(paymentIntentId: string): Promise<void> {
    try {
      // Update payment intent status to cancelled
      await this.db
        .updateTable("payment_intents")
        .set({
          status: "CANCELLED",
          updated_at: new Date(),
        })
        .where("intent_id", "=", paymentIntentId)
        .execute();

      this.logger.info("Cancelled existing payment intent", { paymentIntentId });
    } catch (error) {
      this.logger.error("Failed to cancel existing payment intent", { 
        error: error instanceof Error ? error.message : String(error),
        paymentIntentId 
      });
      // Don't throw error - continue with retry
    }
  }

  /**
   * Updates retry count for a registration
   * @param registrationId - Registration ID
   * @param retryCount - New retry count
   */
  private async updateRetryCount(registrationId: string, retryCount: number): Promise<void> {
    // This could be stored in a separate retry tracking table
    // For now, we'll use the payment_history table
    await this.db
      .insertInto("payment_history")
      .values({
        registration_id: registrationId,
        payment_reference: `RETRY_${retryCount}_${Date.now()}`,
        amount: "0.00", // Retry doesn't change amount
        status: "retry",
        payment_method: "retry_attempt",
        transaction_date: new Date(),
        created_at: new Date(),
      })
      .execute();
  }

  /**
   * Logs retry attempt
   * @param registrationId - Registration ID
   * @param reason - Retry reason
   * @param status - Retry status
   * @param error - Error message if failed
   */
  private async logRetryAttempt(
    registrationId: string,
    reason: string,
    status: "success" | "failed",
    error?: string
  ): Promise<void> {
    await this.db
      .insertInto("payment_history")
      .values({
        registration_id: registrationId,
        payment_reference: `RETRY_LOG_${Date.now()}`,
        amount: "0.00",
        status: status === "success" ? "retry_success" : "retry_failed",
        payment_method: reason,
        transaction_date: new Date(),
        created_at: new Date(),
      })
      .execute();
  }
}
