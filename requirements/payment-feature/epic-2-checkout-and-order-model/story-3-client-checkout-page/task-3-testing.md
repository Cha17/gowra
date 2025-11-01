# Task: Testing Client Checkout Page

Status: Pending

## Implementation Goal

Validate rendering, polling, and redirect logic for the checkout page.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
└── client/src/tests/checkout-page.test.tsx (new)
```

## Testing Specification

- Renders QR img with base64 data
- Polls endpoint; on `succeeded` triggers redirect
- Handles error states gracefully

## Verification Checklist

- [ ] Tests pass
