# Epic: Checkout and Order Model

Status: Pending

## Epic Scope

Add Worker DB schema for orders and checkouts, implement endpoints to create/manage orders and attach payment intents, and add client checkout page to display base64 QR for payment.

## Architecture Impact

Defines persistence for one-time checkouts with multiple attempts allowed until paid. Introduces server-client contract for checkout initiation and QR display.

## Stories in This Epic

| Story   | Technical Focus                     | Dependencies    | Status    |
| ------- | ----------------------------------- | --------------- | --------- |
| Story 1 | DB schema for orders and checkouts  | Epic 1 (client) | Completed |
| Story 2 | Checkout endpoints and validation   | Story 1         | Completed |
| Story 3 | Client checkout page (QR rendering) | Story 2         | Pending   |

## Technical Dependencies

### Prerequisites

- Epic 1: Payment Intent endpoint

### Provides For

- Epic 3: Webhook fulfillment needs order/checkout data

## Integration Requirements

- Worker routes for order creation, checkout creation, and fetching QR
- Client page at `/checkout/[orderId]`

## Technical Risks

- Race conditions if multiple intents are created simultaneously
  - Mitigation: idempotency keys per order and status checks

## Definition of Done

- [ ] DB schemas created and migrated
- [ ] Endpoints for order and checkout operational
- [ ] Client checkout page renders QR and polls status
