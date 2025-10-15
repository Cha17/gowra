# Task: Map Webhook Events to Local Status

Status: Pending

## Implementation Goal

Convert upstream payment event types into local checkout/order statuses.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
└── worker/src/lib/status-mapper.ts (new)
```

## Implementation Details

- Map succeeded -> checkout.succeeded, order.paid
- Map failed/cancelled -> checkout.failed (order stays pending)

## Testing Specification

- Unit tests for mapping function

## Verification Checklist

- [ ] Mapping covers all used event types
