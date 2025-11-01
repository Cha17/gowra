# Task: Validate Signature and Payload

Status: Pending

## Implementation Goal

Verify webhook signature/secret and validate payload schema.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
└── worker/src/middlewares/verify-webhook.ts (new)
```

## Implementation Details

- HMAC or provided signature scheme with secret
- Zod schema for event types used

## Testing Specification

- Invalid signature -> 401
- Invalid schema -> 400

## Verification Checklist

- [ ] Signature verification works
- [ ] Schema validation works
