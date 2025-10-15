# Epic: Webhooks and Fulfillment

Status: Pending

## Epic Scope

Create Worker webhook endpoint to process payment events from NextAPI Partners, validate authenticity, update order/checkout status, and trigger immediate ticket issuance.

## Architecture Impact

Secures inbound events and ensures once-only fulfillment. Integrates with existing ticket issuance logic.

## Stories in This Epic

| Story   | Technical Focus                      | Dependencies | Status  |
| ------- | ------------------------------------ | ------------ | ------- |
| Story 1 | Webhook endpoint and signature check | Epic 1       | Pending |
| Story 2 | Status updates and idempotency       | Story 1      | Pending |
| Story 3 | Ticket issuance integration          | Story 2      | Pending |

## Technical Dependencies

### Prerequisites

- NextAPI webhook secret or validation scheme

### Provides For

- End-to-end payment completion

## Integration Requirements

- Worker route `/payments/webhook` (POST)
- Idempotency keys and replay protection

## Technical Risks

- Duplicate webhook deliveries cause double issuance
  - Mitigation: transactional status updates and idempotency tokens

## Definition of Done

- [ ] Webhook validated and parsed
- [ ] Order/checkout statuses updated correctly
- [ ] Tickets issued immediately on success
