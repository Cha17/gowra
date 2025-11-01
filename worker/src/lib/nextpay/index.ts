// NextPay API Integration - Main Export File

// Core client
export { NextPayClientImpl, createNextPayClient } from "./client";
export type { NextPayClient } from "./types";

// Services
export { NextPayAccountService } from "./account-service";
export { NextPayPaymentIntentService } from "./payment-intent-service";
export { PaymentProcessingService } from "./payment-processing-service";
export { QRCodeService } from "./qr-code-service";
export { PaymentStatusTrackingService } from "./payment-status-tracking-service";
export { PaymentRetryService } from "./payment-retry-service";
export { WebhookSecurityService } from "./webhook-security-service";
export { WebhookProcessingService } from "./webhook-processing-service";

// Configuration
export { loadNextPayConfig, validateNextPayEnv } from "./config";
export type { NextPayConfig } from "./types";

// Authentication
export { NextPayAuthenticator } from "./auth";

// HTTP Client
export { NextPayHttpClientImpl } from "./http-client";
export type { NextPayHttpClient, RequestOptions } from "./types";

// Error Handling
export { 
  NextPayError, 
  NextPayErrorType, 
  createNextPayError, 
  shouldRetry 
} from "./errors";

// Retry Logic
export { RetryManager, createDefaultRetryOptions } from "./retry";
export type { RetryOptions } from "./retry";

// Logging
export { NextPayLogger } from "./logger";
export type { Logger } from "./http-client";

// Types
export type {
  CreateAccountRequest,
  AccountResponse,
  CreatePaymentIntentRequest,
  PaymentIntentResponse,
  PaymentIntentStatus,
  AccountStatus,
  Address,
  LogEntry,
  LogLevel,
  ErrorDetails,
  PerformanceMetrics,
  AuthCredentials,
} from "./types";

// Webhook Types
export type {
  WebhookEvent,
  WebhookEventType,
  WebhookEventData,
  PaymentIntentWebhookData,
  WebhookSignature,
  WebhookValidationResult,
  WebhookProcessingResult,
  TicketIssuanceData,
  WebhookLogEntry,
  WebhookConfig,
  IdempotencyKey,
} from "./webhook-types";
