# Task: Testing Status Updates and Idempotency

Status: Pending

## Implementation Goal

Validate mapping and idempotent processing end-to-end with sample events.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
└── worker/debugging/debug-analytics.js (extend) or new test
```

## Testing Specification

- First success event -> order paid, checkout succeeded
- Repeat same event id -> no duplicate changes

## Verification Checklist

- [ ] Order and checkout update once only
