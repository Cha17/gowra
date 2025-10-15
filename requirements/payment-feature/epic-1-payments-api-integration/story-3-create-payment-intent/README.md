# Story: Create Payment Intent (PHP/QRPH QR)

Status: Completed

## Story Purpose

Expose a Worker endpoint that creates a Payment Intent for one-time ticket order checkout and returns a base64-encoded QR image string to display to the user.

## Acceptance Criteria

- [x] POST /payments/intent creates upstream intent for PHP/QRPH
- [x] Response returns `{ paymentIntentId, qrBase64, currency, amount }`
- [x] Validates order exists and is unpaid

## Technical Specifications

### API Contracts

```yaml
paths:
  /payments/intent:
    post:
      summary: Create payment intent for ticket order
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                orderId: { type: string }
                currency: { type: string, enum: [PHP] }
              required: [orderId, currency]
      responses:
        "201":
          description: Created
          content:
            application/json:
              schema:
                type: object
                properties:
                  paymentIntentId: { type: string }
                  qrBase64: { type: string }
                  amount: { type: number }
                  currency: { type: string }
```

### Component Interfaces

```typescript
export interface CreateIntentResponse {
  paymentIntentId: string;
  qrBase64: string;
  amount: number;
  currency: "PHP";
}
```

## Implementation Tasks

- task-1-worker-route.md: Implement /payments/intent route
- task-2-upstream-intent.md: Call NextAPI create intent for PHP/QRPH QR
- task-3-testing.md: Contract and validation tests

## Dependencies

- **Requires**: Story 1 client and auth
- **Enables**: Checkout flow in Epic 2
