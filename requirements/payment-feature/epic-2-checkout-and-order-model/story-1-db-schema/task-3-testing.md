vvgfvfcdv# Task: Testing DB Schema

Status: Completed

## Implementation Goal

Validate constraints, enums, and indices for orders and checkouts.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
└── worker/debugging/test-simple-db.js (add tests/queries)
```

## Testing Specification

- Insert valid and invalid rows (currency != PHP, missing fields)
- Verify status enums reject invalid states
- Ensure unique(payment_intent_id) enforced

## Verification Checklist

- [x] Invalid rows fail as expected
- [x] Queries return expected results
