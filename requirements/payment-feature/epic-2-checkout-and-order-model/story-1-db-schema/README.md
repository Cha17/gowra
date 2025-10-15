# Story: DB Schema for Orders and Checkouts

Status: Completed

## Story Purpose

Create Worker DB tables for `orders` and `checkouts` supporting one-time checkout with multiple attempts until paid.

## Acceptance Criteria

- [x] `orders` table stores eventId, userId, total, currency, status
- [x] `checkouts` table stores orderId, paymentIntentId, status, amounts, timestamps
- [x] Indexes for efficient lookup by orderId and paymentIntentId

## Technical Specifications

### Data Requirements

```sql
-- drizzle migration example
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  total_amount INTEGER NOT NULL, -- in cents
  currency TEXT NOT NULL CHECK (currency IN ('PHP')),
  status TEXT NOT NULL CHECK (status IN ('pending','paid','cancelled')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE checkouts (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  payment_intent_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('PHP')),
  status TEXT NOT NULL CHECK (status IN ('created','succeeded','failed')),
  qr_base64 TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(payment_intent_id)
);

CREATE INDEX idx_checkouts_order_id ON checkouts(order_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

## Implementation Tasks

- task-1-create-migrations.md: Add drizzle schema and migration
- task-2-update-relations.md: Define relations for orders/checkouts
- task-3-testing.md: Seed and validate constraints

## Dependencies

- **Requires**: None
- **Enables**: Checkout endpoints
