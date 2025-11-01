# Story: Status Updates and Idempotency

Status: Pending

## Story Purpose

Update order and checkout records on webhook events with idempotent processing to prevent duplicate fulfillment.

## Acceptance Criteria

- [ ] Map upstream events to local statuses
- [ ] Ensure once-only update per paymentIntentId and eventId
- [ ] Persist processing log for replay protection

## Technical Specifications

### Data Requirements

```sql
-- Optional idempotency table
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY, -- upstream event id
  payment_intent_id TEXT NOT NULL,
  processed_at INTEGER NOT NULL
);
CREATE INDEX idx_webhook_events_intent ON webhook_events(payment_intent_id);
```

## Implementation Tasks

- task-1-status-mapping.md: Map events to 'succeeded'/'failed'
- task-2-idempotency-store.md: Insert event id; skip repeats
- task-3-testing.md: Duplicate delivery tests

## Dependencies

- **Requires**: Webhook endpoint
- **Enables**: Ticket issuance
