import { Hono } from "hono";
import type { EnvBinding } from "../schema/env";
import { createNextPayClient } from "../lib/nextpay";
import { createDbClient } from "../db/types";
import { PaymentProcessingService } from "../lib/nextpay/payment-processing-service";
import { QRCodeService } from "../lib/nextpay/qr-code-service";
import { PaymentStatusTrackingService } from "../lib/nextpay/payment-status-tracking-service";
import { PaymentRetryService } from "../lib/nextpay/payment-retry-service";

const paymentProcessingRoutes = new Hono<{ Bindings: EnvBinding }>();

// Create payment intent for registration
// PAYMENT DISABLED - Returns success without processing payment
paymentProcessingRoutes.post("/registration/:id/payment-intent", async (c) => {
  try {
    const registrationId = c.req.param("id");
    const body = await c.req.json();
    const { userId } = body;

    if (!userId) {
      return c.json({
        success: false,
        error: "User ID is required",
        message: "Please provide a valid user ID"
      }, 400);
    }

    // Payment integration is disabled - return mock success
    console.log("Payment disabled - returning mock payment intent for registration:", registrationId);

    // Mock payment intent response (no actual payment processing)
    const mockPaymentIntent = {
      id: `mock-intent-${registrationId}`,
      accountId: userId,
      amount: 0,
      currency: "PHP",
      description: "Event Registration",
      status: "COMPLETED",
      qrCode: "", // Empty QR code
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return c.json({
      success: true,
      message: "Registration completed successfully (payment disabled)",
      data: mockPaymentIntent
    }, 201);
  } catch (error) {
    console.error("Failed to create payment intent:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return c.json({
      success: false,
      message: "Failed to create payment intent",
      error: errorMessage,
    }, 500);
  }
});

// Get payment status for registration
// PAYMENT DISABLED - Returns completed status
paymentProcessingRoutes.get("/registration/:id/payment-status", async (c) => {
  try {
    const registrationId = c.req.param("id");
    const userId = c.req.query("userId");

    if (!userId) {
      return c.json({
        success: false,
        error: "User ID is required",
        message: "Please provide a valid user ID as query parameter"
      }, 400);
    }

    // Payment integration is disabled - return mock completed status
    console.log("Payment disabled - returning mock completed status for registration:", registrationId);

    const mockStatus = {
      status: "COMPLETED",
      qrCode: "",
      amount: 0,
      currency: "PHP",
      lastUpdated: new Date().toISOString(),
    };

    return c.json({
      success: true,
      message: "Payment status retrieved successfully (payment disabled)",
      data: mockStatus
    });
  } catch (error) {
    console.error("Failed to get payment status:", error);
    return c.json({
      success: false,
      message: "Failed to get payment status",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Poll payment status (for real-time updates)
paymentProcessingRoutes.post("/payment-intent/:id/poll", async (c) => {
  try {
    const paymentIntentId = c.req.param("id");

    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    const nextpayClient = createNextPayClient(c.env, db);
    const statusService = new PaymentStatusTrackingService(nextpayClient, db, console);

    const result = await statusService.pollPaymentStatus(paymentIntentId);

    return c.json({
      success: true,
      message: "Payment status polled successfully",
      data: result
    });
  } catch (error) {
    console.error("Failed to poll payment status:", error);
    return c.json({
      success: false,
      message: "Failed to poll payment status",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Retry failed payment
// PAYMENT DISABLED - Returns success immediately
paymentProcessingRoutes.post("/registration/:id/retry-payment", async (c) => {
  try {
    const registrationId = c.req.param("id");
    const body = await c.req.json();
    const { userId, reason } = body;

    if (!userId) {
      return c.json({
        success: false,
        error: "User ID is required",
        message: "Please provide a valid user ID"
      }, 400);
    }

    // Payment integration is disabled - return mock success
    console.log("Payment disabled - returning mock retry success for registration:", registrationId);

    const mockPaymentIntent = {
      id: `mock-intent-${registrationId}`,
      accountId: userId,
      amount: 0,
      currency: "PHP",
      description: "Event Registration (Retry)",
      status: "COMPLETED",
      qrCode: "",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return c.json({
      success: true,
      message: "Payment retry successful (payment disabled)",
      data: mockPaymentIntent
    }, 201);
  } catch (error) {
    console.error("Failed to retry payment:", error);
    return c.json({
      success: false,
      message: "Failed to retry payment",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get retry information
paymentProcessingRoutes.get("/registration/:id/retry-info", async (c) => {
  try {
    const registrationId = c.req.param("id");

    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    const nextpayClient = createNextPayClient(c.env, db);
    const retryService = new PaymentRetryService(nextpayClient, db, console);

    const retryInfo = await retryService.getRetryInfo(registrationId);

    return c.json({
      success: true,
      message: "Retry information retrieved successfully",
      data: retryInfo
    });
  } catch (error) {
    console.error("Failed to get retry info:", error);
    return c.json({
      success: false,
      message: "Failed to get retry information",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Validate QR code
paymentProcessingRoutes.post("/qr-code/validate", async (c) => {
  try {
    const body = await c.req.json();
    const { qrCode } = body;

    if (!qrCode) {
      return c.json({
        success: false,
        error: "QR code is required",
        message: "Please provide a QR code to validate"
      }, 400);
    }

    const qrService = new QRCodeService(console);
    const validation = qrService.validateQRCode(qrCode);

    return c.json({
      success: true,
      message: "QR code validation completed",
      data: validation
    });
  } catch (error) {
    console.error("Failed to validate QR code:", error);
    return c.json({
      success: false,
      message: "Failed to validate QR code",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Generate QR code metadata
paymentProcessingRoutes.post("/qr-code/metadata", async (c) => {
  try {
    const body = await c.req.json();
    const { qrCode, expiresAt } = body;

    if (!qrCode) {
      return c.json({
        success: false,
        error: "QR code is required",
        message: "Please provide a QR code"
      }, 400);
    }

    const qrService = new QRCodeService(console);
    const metadata = qrService.generateQRCodeMetadata(qrCode, expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString());

    return c.json({
      success: true,
      message: "QR code metadata generated successfully",
      data: metadata
    });
  } catch (error) {
    console.error("Failed to generate QR code metadata:", error);
    return c.json({
      success: false,
      message: "Failed to generate QR code metadata",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Batch update payment statuses
paymentProcessingRoutes.post("/payment-statuses/batch-update", async (c) => {
  try {
    const body = await c.req.json();
    const { intentIds } = body;

    if (!intentIds || !Array.isArray(intentIds)) {
      return c.json({
        success: false,
        error: "Intent IDs array is required",
        message: "Please provide an array of payment intent IDs"
      }, 400);
    }

    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    const nextpayClient = createNextPayClient(c.env, db);
    const statusService = new PaymentStatusTrackingService(nextpayClient, db, console);

    const results = await statusService.batchUpdatePaymentStatuses(intentIds);

    return c.json({
      success: true,
      message: "Batch payment status update completed",
      data: results
    });
  } catch (error) {
    console.error("Failed to batch update payment statuses:", error);
    return c.json({
      success: false,
      message: "Failed to batch update payment statuses",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

export { paymentProcessingRoutes };
