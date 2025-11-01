# Task: Idempotent Ticket Creation

Status: Pending

## Implementation Goal

Prevent duplicate ticket issuance on repeated success events.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
└── worker/src/lib/fulfillment.ts (guard logic)
```

## Implementation Details

- Use order status and a unique issuance record to prevent duplicates

## Verification Checklist

- [ ] Second call with same order does not create duplicates
