# Task: Create Drizzle Schema and Migrations

Status: Completed

## Implementation Goal

Define `orders` and `checkouts` tables and generate migrations for the Worker DB.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
├── worker/src/db/schema.ts (add tables)
├── worker/drizzle/migration.sql (auto-generated via drizzle)
└── worker/drizzle/relations.ts (add relations if needed)
```

### Code Specifications

```typescript
// orders: id, event_id, user_id, total_amount, currency, status, created_at, updated_at
// checkouts: id, order_id, payment_intent_id, amount, currency, status, qr_base64, created_at, updated_at
```

## Implementation Details

- Use integer minor units for amounts
- Enforce currency = 'PHP'
- Status enums as specified in story README

## Testing Specification

- Apply migration, insert sample `orders` and `checkouts`
- Validate constraints and indices

## Verification Checklist

- [x] Drizzle schema compiles
- [x] Migration runs successfully
