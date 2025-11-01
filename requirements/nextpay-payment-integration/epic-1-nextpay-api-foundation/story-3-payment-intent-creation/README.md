# Story 3: Payment Intent Creation

Status: Pending

## Story Purpose

Implement payment intent creation functionality that generates QR codes for PHP/QRPH payments. This is the core payment processing feature that enables users to complete payments through QR code scanning.

## Acceptance Criteria

- [ ] Payment intent creation endpoint implemented
- [ ] QR code generation for PHP/QRPH payments
- [ ] Payment intent status tracking
- [ ] Integration with order management
- [ ] Proper error handling for payment operations
- [ ] Payment intent validation and security

## Technical Specifications

### Payment Intent Interface

```typescript
export interface CreatePaymentIntentRequest {
  accountId: string;
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
}

export interface PaymentIntentResponse {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  description: string;
  status: PaymentIntentStatus;
  qrCode: string; // Base64 encoded QR code
  qrCodeUrl?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export enum PaymentIntentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}
```

### Payment Intent Service Implementation

```typescript
export class NextPayPaymentIntentService {
  constructor(
    private client: NextPayClient,
    private db: DatabaseClient,
    private logger: Logger
  ) {}

  async createPaymentIntent(
    orderId: string,
    intentData: CreatePaymentIntentRequest
  ): Promise<PaymentIntentResponse> {
    // Validate payment intent data
    this.validatePaymentIntentData(intentData);

    // Check if order exists and is valid
    const order = await this.validateOrder(orderId);

    // Check if payment intent already exists for this order
    const existingIntent = await this.getPaymentIntentByOrderId(orderId);
    if (
      existingIntent &&
      existingIntent.status === PaymentIntentStatus.PENDING
    ) {
      return existingIntent;
    }

    // Create payment intent via NextPay API
    const intentResponse = await this.client.createPaymentIntent(intentData);

    // Store payment intent in database
    await this.storePaymentIntent(orderId, intentResponse);

    // Update order status
    await this.updateOrderStatus(orderId, "payment_pending");

    return intentResponse;
  }

  async getPaymentIntent(intentId: string): Promise<PaymentIntentResponse> {
    return await this.client.getPaymentIntent(intentId);
  }

  async getPaymentIntentByOrderId(
    orderId: string
  ): Promise<PaymentIntentResponse | null> {
    const intentRef = await this.db
      .selectFrom("payment_intents")
      .selectAll()
      .where("order_id", "=", orderId)
      .executeTakeFirst();

    if (!intentRef) {
      return null;
    }

    return await this.getPaymentIntent(intentRef.intent_id);
  }

  async updatePaymentIntentStatus(
    intentId: string,
    status: PaymentIntentStatus
  ): Promise<void> {
    await this.db
      .updateTable("payment_intents")
      .set({
        status,
        updated_at: new Date(),
      })
      .where("intent_id", "=", intentId)
      .execute();
  }

  private validatePaymentIntentData(data: CreatePaymentIntentRequest): void {
    if (
      !data.accountId ||
      !data.amount ||
      !data.currency ||
      !data.description
    ) {
      throw new Error("Required fields missing");
    }

    if (data.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    if (data.currency !== "PHP") {
      throw new Error("Only PHP currency is supported");
    }
  }

  private async validateOrder(orderId: string): Promise<any> {
    const order = await this.db
      .selectFrom("orders")
      .selectAll()
      .where("id", "=", orderId)
      .executeTakeFirst();

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === "paid") {
      throw new Error("Order already paid");
    }

    return order;
  }

  private async storePaymentIntent(
    orderId: string,
    intentResponse: PaymentIntentResponse
  ): Promise<void> {
    await this.db
      .insertInto("payment_intents")
      .values({
        intent_id: intentResponse.id,
        order_id: orderId,
        account_id: intentResponse.accountId,
        amount: intentResponse.amount,
        currency: intentResponse.currency,
        status: intentResponse.status,
        qr_code: intentResponse.qrCode,
        expires_at: new Date(intentResponse.expiresAt),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .execute();
  }
}
```

## Implementation Tasks

- **Task 1**: Payment Intent Data Models
- **Task 2**: Payment Intent Creation Implementation
- **Task 3**: QR Code Generation and Validation
- **Task 4**: Payment Intent Status Management
- **Task 5**: Integration with Order System
- **Task 6**: Payment Intent Service Testing

## Testing Requirements

### Unit Test Coverage

- Payment intent data validation
- Payment intent creation flow
- QR code generation and validation
- Status management operations
- Error handling scenarios

### Integration Testing

- End-to-end payment intent creation
- QR code generation with real API
- Payment intent status updates
- Order integration testing

## Dependencies

- **Requires**: Story 1 (NextPay API Client Setup), Story 2 (Account Management)
- **Enables**: Epic 2 (Payment Processing Integration)

## Technical Notes

- Implement proper QR code validation
- Add comprehensive error handling
- Ensure payment intent security
- Add logging for all operations
- Consider payment intent expiration handling
- Implement idempotency for payment intent creation
