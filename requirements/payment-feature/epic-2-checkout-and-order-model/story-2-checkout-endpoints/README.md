# Story: Checkout Endpoints and Validation

Status: Completed

## Story Purpose

Implement Worker routes to create orders, create checkouts (which call payment intent), and fetch checkout/QR details.

## Acceptance Criteria

- [x] POST /orders creates an order (pending)
- [x] POST /checkout creates a checkout for an unpaid order and returns qrBase64
- [x] GET /checkout/:id returns status and QR for display

## Technical Specifications

### API Contracts

```yaml
paths:
  /orders:
    post:
      summary: Create an order
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                eventId: { type: string }
                userId: { type: string }
                totalAmount: { type: integer }
                currency: { type: string, enum: [PHP] }
              required: [eventId, userId, totalAmount, currency]
      responses:
        "201": { description: Created }
  /checkout:
    post:
      summary: Create a checkout for an order and generate QR
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                orderId: { type: string }
              required: [orderId]
      responses:
        "201":
          description: Created
          content:
            application/json:
              schema:
                type: object
                properties:
                  checkoutId: { type: string }
                  paymentIntentId: { type: string }
                  qrBase64: { type: string }
                  amount: { type: integer }
                  currency: { type: string }
  /checkout/{id}:
    get:
      summary: Get checkout details
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      responses:
        "200": { description: OK }
```

## Implementation Tasks

- task-1-orders-route.md: Implement POST /orders
- task-2-checkout-route.md: Implement POST /checkout calling /payments/intent
- task-3-get-checkout-route.md: Implement GET /checkout/:id
- task-4-testing.md: Endpoint tests

## Dependencies

- **Requires**: Epic 1 payment intent endpoint
- **Enables**: Client checkout UI
