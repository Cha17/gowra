import { Hono } from "hono";
import type { EnvBinding } from "../schema/env";
import { createNextPayClient } from "../lib/nextpay";
import { createDbClient } from "../db/types";
import { WebhookSecurityService } from "../lib/nextpay/webhook-security-service";
import { WebhookProcessingService } from "../lib/nextpay/webhook-processing-service";
import type { WebhookConfig } from "../lib/nextpay/webhook-types";

const webhookRoutes = new Hono<{ Bindings: EnvBinding }>();

// Main webhook endpoint for NextPay
webhookRoutes.post("/nextpay", async (c) => {
  try {
    const rawPayload = await c.req.text();
    const headers = Object.fromEntries(c.req.headers.entries());
    
    // Extract signature data
    const webhookConfig: WebhookConfig = {
      secretKey: c.env.WEBHOOK_SECRET || "default-secret-key",
      tolerance: 300, // 5 minutes
      maxRetries: 3,
      retryDelay: 1000
    };

    const securityService = new WebhookSecurityService(webhookConfig, console);
    const signatureData = securityService.extractSignatureData(headers);

    if (!signatureData) {
      console.error("Missing webhook signature headers");
      return c.json({
        success: false,
        error: "Missing signature headers",
        message: "Webhook signature validation failed"
      }, 400);
    }

    // Validate webhook request
    const validation = securityService.validateWebhookRequest(
      rawPayload,
      signatureData.signature,
      signatureData.timestamp
    );

    if (!validation.isValid || !validation.event) {
      console.error("Webhook validation failed:", validation.error);
      return c.json({
        success: false,
        error: validation.error,
        message: "Webhook validation failed"
      }, 400);
    }

    // Generate idempotency key
    const idempotencyKey = `${validation.event.id}_${validation.event.type}_${Date.now()}`;

    // Process webhook event
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    const nextpayClient = createNextPayClient(c.env, db);
    const processingService = new WebhookProcessingService(nextpayClient, db, console);

    const result = await processingService.processWebhookEvent(
      validation.event,
      idempotencyKey
    );

    if (!result.success) {
      console.error("Webhook processing failed:", result.error);
      return c.json({
        success: false,
        error: result.error,
        message: "Webhook processing failed"
      }, 500);
    }

    console.log("Webhook processed successfully", {
      eventId: validation.event.id,
      eventType: validation.event.type,
      ticketIssued: result.ticketIssued,
      statusUpdated: result.statusUpdated
    });

    return c.json({
      success: true,
      message: "Webhook processed successfully",
      data: {
        eventId: validation.event.id,
        eventType: validation.event.type,
        processed: result.processed,
        ticketIssued: result.ticketIssued,
        statusUpdated: result.statusUpdated
      }
    });
  } catch (error) {
    console.error("Webhook endpoint error:", error);
    return c.json({
      success: false,
      message: "Internal webhook processing error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Webhook health check
webhookRoutes.get("/health", async (c) => {
  try {
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });

    // Check database connectivity
    const testQuery = await db
      .selectFrom("webhook_logs")
      .select(db.fn.count("id").as("count"))
      .executeTakeFirst();

    return c.json({
      success: true,
      message: "Webhook service is healthy",
      data: {
        database: "connected",
        webhookLogs: Number(testQuery?.count || 0)
      }
    });
  } catch (error) {
    console.error("Webhook health check failed:", error);
    return c.json({
      success: false,
      message: "Webhook service health check failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get webhook logs (for debugging)
webhookRoutes.get("/logs", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");

    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });

    const logs = await db
      .selectFrom("webhook_logs")
      .selectAll()
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    const totalCount = await db
      .selectFrom("webhook_logs")
      .select(db.fn.count("id").as("count"))
      .executeTakeFirst();

    return c.json({
      success: true,
      message: "Webhook logs retrieved successfully",
      data: {
        logs,
        pagination: {
          total: Number(totalCount?.count || 0),
          limit,
          offset,
          hasMore: logs.length === limit
        }
      }
    });
  } catch (error) {
    console.error("Failed to get webhook logs:", error);
    return c.json({
      success: false,
      message: "Failed to retrieve webhook logs",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get webhook statistics
webhookRoutes.get("/stats", async (c) => {
  try {
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });

    // Get webhook statistics
    const stats = await db
      .selectFrom("webhook_logs")
      .select([
        db.fn.count("id").as("total"),
        db.fn.count("id").filterWhere("status", "=", "processed").as("processed"),
        db.fn.count("id").filterWhere("status", "=", "failed").as("failed"),
        db.fn.count("id").filterWhere("event_type", "=", "payment_intent.succeeded").as("successful_payments"),
        db.fn.count("id").filterWhere("event_type", "=", "payment_intent.failed").as("failed_payments")
      ])
      .executeTakeFirst();

    // Get recent activity
    const recentActivity = await db
      .selectFrom("webhook_logs")
      .selectAll()
      .orderBy("created_at", "desc")
      .limit(10)
      .execute();

    return c.json({
      success: true,
      message: "Webhook statistics retrieved successfully",
      data: {
        statistics: {
          total: Number(stats?.total || 0),
          processed: Number(stats?.processed || 0),
          failed: Number(stats?.failed || 0),
          successfulPayments: Number(stats?.successful_payments || 0),
          failedPayments: Number(stats?.failed_payments || 0)
        },
        recentActivity
      }
    });
  } catch (error) {
    console.error("Failed to get webhook statistics:", error);
    return c.json({
      success: false,
      message: "Failed to retrieve webhook statistics",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Test webhook endpoint (for development)
webhookRoutes.post("/test", async (c) => {
  try {
    const body = await c.req.json();
    const { eventType, paymentIntentId, status } = body;

    if (!eventType || !paymentIntentId || !status) {
      return c.json({
        success: false,
        error: "Missing required fields",
        message: "Please provide eventType, paymentIntentId, and status"
      }, 400);
    }

    // Create test webhook event
    const testEvent = {
      id: `test_${Date.now()}`,
      type: eventType,
      created: new Date().toISOString(),
      data: {
        id: `test_${Date.now()}`,
        object: "event",
        type: eventType,
        created: new Date().toISOString(),
        livemode: false,
        data: {
          object: {
            id: paymentIntentId,
            object: "payment_intent",
            amount: 10000,
            currency: "PHP",
            status: status,
            description: "Test payment",
            metadata: {
              test: true
            },
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            account_id: "test_account"
          }
        }
      }
    };

    const idempotencyKey = `test_${testEvent.id}_${Date.now()}`;

    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    const nextpayClient = createNextPayClient(c.env, db);
    const processingService = new WebhookProcessingService(nextpayClient, db, console);

    const result = await processingService.processWebhookEvent(testEvent, idempotencyKey);

    return c.json({
      success: true,
      message: "Test webhook processed successfully",
      data: {
        eventId: testEvent.id,
        eventType: testEvent.type,
        processed: result.processed,
        ticketIssued: result.ticketIssued,
        statusUpdated: result.statusUpdated
      }
    });
  } catch (error) {
    console.error("Test webhook failed:", error);
    return c.json({
      success: false,
      message: "Test webhook processing failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

export { webhookRoutes };
