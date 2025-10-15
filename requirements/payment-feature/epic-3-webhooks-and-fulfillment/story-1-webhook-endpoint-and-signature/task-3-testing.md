# Task: Testing Webhook Endpoint

Status: Pending

## Implementation Goal

Test signature verification and payload validation paths.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
└── worker/debugging/test-staging.js (extend) or new webhook test
```

## Testing Specification

- Valid signature + valid payload -> 200
- Invalid signature -> 401
- Invalid payload -> 400

## Verification Checklist

- [ ] All cases return expected codes
