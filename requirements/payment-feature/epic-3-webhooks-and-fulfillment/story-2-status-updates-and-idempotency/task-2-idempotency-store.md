# Task: Implement Idempotency Store

Status: Pending

## Implementation Goal

Persist processed webhook event ids and skip duplicates.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
├── worker/src/db/schema.ts (add webhook_events)
└── worker/src/lib/idempotency.ts (new helpers)
```

### Code Specifications

```sql
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,
  payment_intent_id TEXT NOT NULL,
  processed_at INTEGER NOT NULL
);
```

## Testing Specification

- Insert first-time event -> processed
- Re-send same id -> skipped

## Verification Checklist

- [ ] Duplicate events detected and skipped
