# Task: Testing Checkout Endpoints

Status: Pending

## Implementation Goal

Ensure order and checkout endpoints work and enforce validation.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
└── worker/debugging/test-organizer-endpoints.js (extend) or new test file
```

## Testing Specification

- Create order -> 201
- Create checkout -> 201 returns qrBase64, paymentIntentId
- Get checkout -> 200 returns status
- Attempt checkout when order paid -> 409

## Verification Checklist

- [ ] All scenarios return expected codes
