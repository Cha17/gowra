import type { 
  WebhookEvent, 
  WebhookProcessingResult,
  WebhookLogEntry,
  IdempotencyKey,
  TicketIssuanceData,
  PaymentIntentWebhookData
} from './webhook-types';
import type { DatabaseClient } from '../../db/types';
import type { Logger } from './http-client';
import { NextPayClientImpl } from './client';

/**
 * Webhook Processing Service handles webhook events and triggers fulfillment
 */
export class WebhookProcessingService {
  constructor(
    private nextpayClient: NextPayClientImpl,
    private db: DatabaseClient,
    private logger: Logger
  ) {}

  /**
   * Processes a webhook event
   * @param event - Webhook event
   * @param idempotencyKey - Idempotency key for duplicate prevention
   * @returns Processing result
   */
  async processWebhookEvent(
    event: WebhookEvent,
    idempotencyKey: string
  ): Promise<WebhookProcessingResult> {
    this.logger.info("Processing webhook event", { 
      eventId: event.id,
      eventType: event.type,
      idempotencyKey 
    });

    try {
      // Check idempotency
      const isDuplicate = await this.checkIdempotency(idempotencyKey);
      if (isDuplicate) {
        this.logger.info("Duplicate webhook event detected", { 
          eventId: event.id,
          idempotencyKey 
        });
        return {
          success: true,
          processed: false,
          error: "Duplicate event"
        };
      }

      // Log webhook receipt
      await this.logWebhookEvent(event, 'received');

      // Process based on event type
      let result: WebhookProcessingResult;
      
      switch (event.type) {
        case 'payment_intent.succeeded':
          result = await this.handlePaymentSuccess(event);
          break;
        case 'payment_intent.failed':
          result = await this.handlePaymentFailure(event);
          break;
        case 'payment_intent.canceled':
          result = await this.handlePaymentCancellation(event);
          break;
        case 'payment_intent.expired':
          result = await this.handlePaymentExpiration(event);
          break;
        default:
          result = await this.handleGenericEvent(event);
      }

      // Mark as processed
      await this.markIdempotencyProcessed(idempotencyKey, result);

      // Update webhook log
      await this.updateWebhookLog(event.id, result.success ? 'processed' : 'failed', result.error);

      this.logger.info("Webhook event processed", { 
        eventId: event.id,
        success: result.success,
        ticketIssued: result.ticketIssued,
        statusUpdated: result.statusUpdated
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error("Webhook processing failed", { 
        error: errorMessage,
        eventId: event.id,
        eventType: event.type
      });

      // Update webhook log with error
      await this.updateWebhookLog(event.id, 'failed', errorMessage);

      return {
        success: false,
        processed: false,
        error: errorMessage
      };
    }
  }

  /**
   * Handles successful payment events
   * @param event - Webhook event
   * @returns Processing result
   */
  private async handlePaymentSuccess(event: WebhookEvent): Promise<WebhookProcessingResult> {
    this.logger.info("Handling payment success", { eventId: event.id });

    try {
      const paymentData = event.data.data.object as PaymentIntentWebhookData;
      
      // Update payment intent status
      await this.updatePaymentIntentStatus(paymentData.id, 'COMPLETED');
      
      // Update order status
      await this.updateOrderStatus(paymentData);
      
      // Update registration status
      await this.updateRegistrationStatus(paymentData);
      
      // Issue ticket
      const ticketIssued = await this.issueTicket(paymentData);

      return {
        success: true,
        processed: true,
        ticketIssued,
        statusUpdated: true
      };
    } catch (error) {
      this.logger.error("Payment success handling failed", { 
        error: error instanceof Error ? error.message : String(error),
        eventId: event.id
      });
      throw error;
    }
  }

  /**
   * Handles failed payment events
   * @param event - Webhook event
   * @returns Processing result
   */
  private async handlePaymentFailure(event: WebhookEvent): Promise<WebhookProcessingResult> {
    this.logger.info("Handling payment failure", { eventId: event.id });

    try {
      const paymentData = event.data.data.object as PaymentIntentWebhookData;
      
      // Update payment intent status
      await this.updatePaymentIntentStatus(paymentData.id, 'FAILED');
      
      // Update order status
      await this.updateOrderStatus(paymentData, 'cancelled');
      
      // Update registration status
      await this.updateRegistrationStatus(paymentData, 'failed');

      return {
        success: true,
        processed: true,
        statusUpdated: true
      };
    } catch (error) {
      this.logger.error("Payment failure handling failed", { 
        error: error instanceof Error ? error.message : String(error),
        eventId: event.id
      });
      throw error;
    }
  }

  /**
   * Handles payment cancellation events
   * @param event - Webhook event
   * @returns Processing result
   */
  private async handlePaymentCancellation(event: WebhookEvent): Promise<WebhookProcessingResult> {
    this.logger.info("Handling payment cancellation", { eventId: event.id });

    try {
      const paymentData = event.data.data.object as PaymentIntentWebhookData;
      
      // Update payment intent status
      await this.updatePaymentIntentStatus(paymentData.id, 'CANCELLED');
      
      // Update order status
      await this.updateOrderStatus(paymentData, 'cancelled');
      
      // Update registration status
      await this.updateRegistrationStatus(paymentData, 'cancelled');

      return {
        success: true,
        processed: true,
        statusUpdated: true
      };
    } catch (error) {
      this.logger.error("Payment cancellation handling failed", { 
        error: error instanceof Error ? error.message : String(error),
        eventId: event.id
      });
      throw error;
    }
  }

  /**
   * Handles payment expiration events
   * @param event - Webhook event
   * @returns Processing result
   */
  private async handlePaymentExpiration(event: WebhookEvent): Promise<WebhookProcessingResult> {
    this.logger.info("Handling payment expiration", { eventId: event.id });

    try {
      const paymentData = event.data.data.object as PaymentIntentWebhookData;
      
      // Update payment intent status
      await this.updatePaymentIntentStatus(paymentData.id, 'EXPIRED');
      
      // Update order status
      await this.updateOrderStatus(paymentData, 'cancelled');
      
      // Update registration status
      await this.updateRegistrationStatus(paymentData, 'expired');

      return {
        success: true,
        processed: true,
        statusUpdated: true
      };
    } catch (error) {
      this.logger.error("Payment expiration handling failed", { 
        error: error instanceof Error ? error.message : String(error),
        eventId: event.id
      });
      throw error;
    }
  }

  /**
   * Handles generic webhook events
   * @param event - Webhook event
   * @returns Processing result
   */
  private async handleGenericEvent(event: WebhookEvent): Promise<WebhookProcessingResult> {
    this.logger.info("Handling generic webhook event", { 
      eventId: event.id,
      eventType: event.type 
    });

    // For now, just log generic events
    return {
      success: true,
      processed: true
    };
  }

  /**
   * Updates payment intent status
   * @param paymentIntentId - Payment intent ID
   * @param status - New status
   */
  private async updatePaymentIntentStatus(paymentIntentId: string, status: string): Promise<void> {
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
   * Updates order status
   * @param paymentData - Payment data
   * @param status - New status (optional)
   */
  private async updateOrderStatus(
    paymentData: PaymentIntentWebhookData, 
    status?: string
  ): Promise<void> {
    const orderStatus = status || (paymentData.status === 'COMPLETED' ? 'paid' : 'cancelled');
    
    // Find order by payment intent
    const paymentIntent = await this.db
      .selectFrom("payment_intents")
      .select("order_id")
      .where("intent_id", "=", paymentData.id)
      .executeTakeFirst();

    if (paymentIntent) {
      await this.db
        .updateTable("orders")
        .set({
          status: orderStatus as any,
          updated_at: new Date(),
        })
        .where("id", "=", paymentIntent.order_id)
        .execute();
    }
  }

  /**
   * Updates registration status
   * @param paymentData - Payment data
   * @param status - New status (optional)
   */
  private async updateRegistrationStatus(
    paymentData: PaymentIntentWebhookData, 
    status?: string
  ): Promise<void> {
    const registrationStatus = status || (paymentData.status === 'COMPLETED' ? 'paid' : 'pending');
    
    // Find registration by payment intent
    const paymentIntent = await this.db
      .selectFrom("payment_intents")
      .innerJoin("orders", "orders.id", "payment_intents.order_id")
      .select("orders.event_id", "orders.user_id")
      .where("payment_intents.intent_id", "=", paymentData.id)
      .executeTakeFirst();

    if (paymentIntent) {
      await this.db
        .updateTable("registrations")
        .set({
          payment_status: registrationStatus as any,
          updated_at: new Date(),
        })
        .where("event_id", "=", paymentIntent.event_id)
        .where("user_id", "=", paymentIntent.user_id)
        .execute();
    }
  }

  /**
   * Issues ticket for successful payment
   * @param paymentData - Payment data
   * @returns true if ticket was issued
   */
  private async issueTicket(paymentData: PaymentIntentWebhookData): Promise<boolean> {
    try {
      // Get order and registration details
      const orderDetails = await this.db
        .selectFrom("payment_intents")
        .innerJoin("orders", "orders.id", "payment_intents.order_id")
        .innerJoin("registrations", "registrations.event_id", "orders.event_id")
        .select([
          "orders.id as order_id",
          "orders.user_id",
          "orders.event_id",
          "registrations.id as registration_id"
        ])
        .where("payment_intents.intent_id", "=", paymentData.id)
        .executeTakeFirst();

      if (!orderDetails) {
        this.logger.warn("Order details not found for ticket issuance", { 
          paymentIntentId: paymentData.id 
        });
        return false;
      }

      // Check if ticket already issued
      const existingTicket = await this.db
        .selectFrom("ticket_issuances")
        .select("order_id")
        .where("order_id", "=", orderDetails.order_id)
        .executeTakeFirst();

      if (existingTicket) {
        this.logger.info("Ticket already issued", { 
          orderId: orderDetails.order_id 
        });
        return true;
      }

      // Issue ticket
      await this.db
        .insertInto("ticket_issuances")
        .values({
          order_id: orderDetails.order_id,
          user_id: orderDetails.user_id,
          event_id: orderDetails.event_id,
          created_at: new Date(),
        })
        .execute();

      this.logger.info("Ticket issued successfully", { 
        orderId: orderDetails.order_id,
        registrationId: orderDetails.registration_id
      });

      return true;
    } catch (error) {
      this.logger.error("Ticket issuance failed", { 
        error: error instanceof Error ? error.message : String(error),
        paymentIntentId: paymentData.id
      });
      return false;
    }
  }

  /**
   * Checks idempotency to prevent duplicate processing
   * @param idempotencyKey - Idempotency key
   * @returns true if duplicate
   */
  private async checkIdempotency(idempotencyKey: string): Promise<boolean> {
    const existing = await this.db
      .selectFrom("webhook_idempotency")
      .select("processed")
      .where("key", "=", idempotencyKey)
      .executeTakeFirst();

    return !!existing?.processed;
  }

  /**
   * Marks idempotency key as processed
   * @param idempotencyKey - Idempotency key
   * @param result - Processing result
   */
  private async markIdempotencyProcessed(
    idempotencyKey: string, 
    result: WebhookProcessingResult
  ): Promise<void> {
    await this.db
      .insertInto("webhook_idempotency")
      .values({
        key: idempotencyKey,
        event_id: "", // Will be updated by caller
        processed: true,
        result: JSON.stringify(result),
        created_at: new Date(),
        processed_at: new Date(),
      })
      .onConflict("key")
      .doUpdateSet({
        processed: true,
        result: JSON.stringify(result),
        processed_at: new Date(),
      })
      .execute();
  }

  /**
   * Logs webhook event
   * @param event - Webhook event
   * @param status - Log status
   */
  private async logWebhookEvent(event: WebhookEvent, status: string): Promise<void> {
    await this.db
      .insertInto("webhook_logs")
      .values({
        webhook_id: event.id,
        event_type: event.type,
        status: status as any,
        created_at: new Date(),
      })
      .execute();
  }

  /**
   * Updates webhook log
   * @param webhookId - Webhook ID
   * @param status - New status
   * @param error - Error message (optional)
   */
  private async updateWebhookLog(
    webhookId: string, 
    status: string, 
    error?: string
  ): Promise<void> {
    await this.db
      .updateTable("webhook_logs")
      .set({
        status: status as any,
        processed_at: new Date(),
        error,
      })
      .where("webhook_id", "=", webhookId)
      .execute();
  }
}
