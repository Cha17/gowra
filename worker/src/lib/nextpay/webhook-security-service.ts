import crypto from 'crypto';
import type { 
  WebhookEvent, 
  WebhookSignature, 
  WebhookValidationResult,
  WebhookConfig 
} from './webhook-types';
import type { Logger } from './http-client';

/**
 * Webhook Security and Validation Service
 */
export class WebhookSecurityService {
  constructor(
    private config: WebhookConfig,
    private logger: Logger
  ) {}

  /**
   * Validates webhook signature
   * @param payload - Raw webhook payload
   * @param signature - Webhook signature header
   * @param timestamp - Webhook timestamp header
   * @returns Validation result
   */
  validateSignature(
    payload: string,
    signature: string,
    timestamp: string
  ): WebhookValidationResult {
    this.logger.debug("Validating webhook signature", { 
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
      payloadLength: payload.length 
    });

    try {
      // Check timestamp tolerance
      const currentTime = Math.floor(Date.now() / 1000);
      const webhookTime = parseInt(timestamp);
      
      if (Math.abs(currentTime - webhookTime) > this.config.tolerance) {
        this.logger.warn("Webhook timestamp tolerance exceeded", {
          currentTime,
          webhookTime,
          tolerance: this.config.tolerance
        });
        return {
          isValid: false,
          error: "Timestamp tolerance exceeded"
        };
      }

      // Verify signature
      const expectedSignature = this.generateSignature(payload, timestamp);
      
      if (!this.compareSignatures(signature, expectedSignature)) {
        this.logger.warn("Webhook signature validation failed", {
          providedSignature: signature.substring(0, 10) + "...",
          expectedSignature: expectedSignature.substring(0, 10) + "..."
        });
        return {
          isValid: false,
          error: "Invalid signature"
        };
      }

      this.logger.info("Webhook signature validated successfully");
      return {
        isValid: true
      };
    } catch (error) {
      this.logger.error("Webhook signature validation error", { 
        error: error instanceof Error ? error.message : String(error)
      });
      return {
        isValid: false,
        error: "Signature validation failed"
      };
    }
  }

  /**
   * Parses and validates webhook event
   * @param payload - Raw webhook payload
   * @returns Parsed webhook event
   */
  parseWebhookEvent(payload: string): WebhookValidationResult {
    try {
      const event = JSON.parse(payload) as WebhookEvent;
      
      // Validate required fields
      if (!event.id || !event.type || !event.created || !event.data) {
        return {
          isValid: false,
          error: "Missing required webhook fields"
        };
      }

      // Validate event type
      const validEventTypes = [
        'payment_intent.created',
        'payment_intent.succeeded',
        'payment_intent.failed',
        'payment_intent.canceled',
        'payment_intent.expired',
        'deposit.confirmed',
        'direct_transfer.received',
        'payout.succeeded',
        'payout.failed',
        'payout.processed',
        'payout.processing_failed',
        'payout_request.processed',
        'payout_request.queued',
        'payout_request.queue_failed',
        'payout_request.creation_failed',
        'legal_entity.verification_status_changed'
      ];

      if (!validEventTypes.includes(event.type)) {
        return {
          isValid: false,
          error: `Invalid event type: ${event.type}`
        };
      }

      this.logger.debug("Webhook event parsed successfully", { 
        eventId: event.id,
        eventType: event.type 
      });

      return {
        isValid: true,
        event
      };
    } catch (error) {
      this.logger.error("Failed to parse webhook event", { 
        error: error instanceof Error ? error.message : String(error)
      });
      return {
        isValid: false,
        error: "Invalid JSON payload"
      };
    }
  }

  /**
   * Validates complete webhook request
   * @param payload - Raw webhook payload
   * @param signature - Webhook signature header
   * @param timestamp - Webhook timestamp header
   * @returns Complete validation result
   */
  validateWebhookRequest(
    payload: string,
    signature: string,
    timestamp: string
  ): WebhookValidationResult {
    // First validate signature
    const signatureValidation = this.validateSignature(payload, signature, timestamp);
    if (!signatureValidation.isValid) {
      return signatureValidation;
    }

    // Then parse and validate event
    const eventValidation = this.parseWebhookEvent(payload);
    if (!eventValidation.isValid) {
      return eventValidation;
    }

    return {
      isValid: true,
      event: eventValidation.event
    };
  }

  /**
   * Generates expected signature for validation
   * @param payload - Raw payload
   * @param timestamp - Timestamp
   * @returns Generated signature
   */
  private generateSignature(payload: string, timestamp: string): string {
    const signedPayload = `${timestamp}.${payload}`;
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(signedPayload, 'utf8')
      .digest('hex');
    }

  /**
   * Compares signatures using constant-time comparison
   * @param signature1 - First signature
   * @param signature2 - Second signature
   * @returns true if signatures match
   */
  private compareSignatures(signature1: string, signature2: string): boolean {
    if (signature1.length !== signature2.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(signature1, 'hex'),
      Buffer.from(signature2, 'hex')
    );
  }

  /**
   * Extracts signature and timestamp from headers
   * @param headers - Request headers
   * @returns Extracted signature data
   */
  extractSignatureData(headers: Record<string, string>): WebhookSignature | null {
    const signature = headers['x-nextpay-signature'] || headers['x-signature'];
    const timestamp = headers['x-nextpay-timestamp'] || headers['x-timestamp'];

    if (!signature || !timestamp) {
      this.logger.warn("Missing webhook signature headers", {
        hasSignature: !!signature,
        hasTimestamp: !!timestamp,
        availableHeaders: Object.keys(headers)
      });
      return null;
    }

    return {
      signature,
      timestamp
    };
  }

  /**
   * Validates webhook configuration
   * @param config - Webhook configuration
   * @returns Validation result
   */
  validateConfig(config: WebhookConfig): { isValid: boolean; error?: string } {
    if (!config.secretKey || config.secretKey.length < 32) {
      return {
        isValid: false,
        error: "Invalid or weak secret key"
      };
    }

    if (config.tolerance < 0 || config.tolerance > 300) {
      return {
        isValid: false,
        error: "Tolerance must be between 0 and 300 seconds"
      };
    }

    if (config.maxRetries < 0 || config.maxRetries > 10) {
      return {
        isValid: false,
        error: "Max retries must be between 0 and 10"
      };
    }

    if (config.retryDelay < 1000 || config.retryDelay > 60000) {
      return {
        isValid: false,
        error: "Retry delay must be between 1000 and 60000 milliseconds"
      };
    }

    return { isValid: true };
  }
}
