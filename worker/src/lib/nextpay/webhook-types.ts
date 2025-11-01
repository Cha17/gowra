/**
 * NextPay Webhook Types and Interfaces
 */

export type WebhookEventType = 
  | 'payment_intent.created'
  | 'payment_intent.succeeded'
  | 'payment_intent.failed'
  | 'payment_intent.canceled'
  | 'payment_intent.expired'
  | 'deposit.confirmed'
  | 'direct_transfer.received'
  | 'payout.succeeded'
  | 'payout.failed'
  | 'payout.processed'
  | 'payout.processing_failed'
  | 'payout_request.processed'
  | 'payout_request.queued'
  | 'payout_request.queue_failed'
  | 'payout_request.creation_failed'
  | 'legal_entity.verification_status_changed';

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  created: string;
  data: WebhookEventData;
}

export interface WebhookEventData {
  id: string;
  object: string;
  type: WebhookEventType;
  created: string;
  livemode: boolean;
  data: {
    object: any;
  };
}

export interface PaymentIntentWebhookData {
  id: string;
  object: 'payment_intent';
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  description?: string;
  metadata?: Record<string, any>;
  created: string;
  updated: string;
  expires_at?: string;
  qr_code?: string;
  account_id: string;
}

export interface WebhookSignature {
  timestamp: string;
  signature: string;
}

export interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
  event?: WebhookEvent;
}

export interface WebhookProcessingResult {
  success: boolean;
  processed: boolean;
  error?: string;
  ticketIssued?: boolean;
  statusUpdated?: boolean;
}

export interface TicketIssuanceData {
  registrationId: string;
  userId: string;
  eventId: string;
  orderId: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  issuedAt: string;
}

export interface WebhookLogEntry {
  id: string;
  webhookId: string;
  eventType: WebhookEventType;
  status: 'received' | 'processing' | 'processed' | 'failed';
  processedAt?: string;
  error?: string;
  ticketIssued?: boolean;
  createdAt: string;
}

export interface WebhookConfig {
  secretKey: string;
  tolerance: number; // Signature tolerance in seconds
  maxRetries: number;
  retryDelay: number; // Delay between retries in milliseconds
}

export interface IdempotencyKey {
  key: string;
  eventId: string;
  processed: boolean;
  result?: WebhookProcessingResult;
  createdAt: string;
  processedAt?: string;
}
