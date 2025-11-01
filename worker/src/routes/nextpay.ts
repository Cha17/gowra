import { Hono } from "hono";
import type { EnvBinding } from "../schema/env";
import { createNextPayClient } from "../lib/nextpay";
import { createDbClient } from "../db/types";

const nextpayRoutes = new Hono<{ Bindings: EnvBinding }>();

// Health check for NextPay integration
nextpayRoutes.get("/health", async (c) => {
  try {
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    const client = createNextPayClient(c.env, db);
    const health = await client.healthCheck();
    
    return c.json({
      success: true,
      message: "NextPay integration is healthy",
      data: health
    });
  } catch (error) {
    console.error("NextPay health check failed:", error);
    return c.json({
      success: false,
      message: "NextPay integration health check failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Test account creation (for testing purposes)
nextpayRoutes.post("/test-account", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, name, email, phone } = body;

    if (!userId || !name || !email) {
      return c.json({
        success: false,
        error: "userId, name and email are required",
        message: "Please provide userId, name and email for account creation"
      }, 400);
    }

    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    const client = createNextPayClient(c.env, db);
    const account = await client.createUserAccount(userId, {
      name,
      email,
      phone,
      metadata: {
        test: true,
        createdBy: "gowra-test"
      }
    });

    return c.json({
      success: true,
      message: "Test account created successfully",
      data: account
    }, 201);
  } catch (error) {
    console.error("Test account creation failed:", error);
    return c.json({
      success: false,
      message: "Failed to create test account",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Test payment intent creation (for testing purposes)
nextpayRoutes.post("/test-payment-intent", async (c) => {
  try {
    const body = await c.req.json();
    const { accountId, amount, description, orderId } = body;

    if (!accountId || !amount || !description || !orderId) {
      return c.json({
        success: false,
        error: "Missing required fields",
        message: "Please provide accountId, amount, description, and orderId"
      }, 400);
    }

    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    const client = createNextPayClient(c.env, db);
    const paymentIntent = await client.createOrderPaymentIntent(orderId, {
      accountId,
      amount: Number(amount),
      currency: "PHP",
      description,
      orderId,
      metadata: {
        test: true,
        createdBy: "gowra-test"
      }
    });

    return c.json({
      success: true,
      message: "Test payment intent created successfully",
      data: paymentIntent
    }, 201);
  } catch (error) {
    console.error("Test payment intent creation failed:", error);
    return c.json({
      success: false,
      message: "Failed to create test payment intent",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get account by ID
nextpayRoutes.get("/account/:id", async (c) => {
  try {
    const accountId = c.req.param("id");
    
    if (!accountId) {
      return c.json({
        success: false,
        error: "Account ID is required",
        message: "Please provide a valid account ID"
      }, 400);
    }

    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    const client = createNextPayClient(c.env, db);
    const account = await client.getAccount(accountId);

    return c.json({
      success: true,
      message: "Account retrieved successfully",
      data: account
    });
  } catch (error) {
    console.error("Failed to retrieve account:", error);
    return c.json({
      success: false,
      message: "Failed to retrieve account",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get payment intent by ID
nextpayRoutes.get("/payment-intent/:id", async (c) => {
  try {
    const intentId = c.req.param("id");
    
    if (!intentId) {
      return c.json({
        success: false,
        error: "Payment intent ID is required",
        message: "Please provide a valid payment intent ID"
      }, 400);
    }

    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    const client = createNextPayClient(c.env, db);
    const paymentIntent = await client.getPaymentIntent(intentId);

    return c.json({
      success: true,
      message: "Payment intent retrieved successfully",
      data: paymentIntent
    });
  } catch (error) {
    console.error("Failed to retrieve payment intent:", error);
    return c.json({
      success: false,
      message: "Failed to retrieve payment intent",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

export { nextpayRoutes };
