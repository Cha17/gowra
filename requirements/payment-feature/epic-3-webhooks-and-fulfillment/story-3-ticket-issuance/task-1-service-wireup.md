# Task: Wire Ticket Issuance from Webhook

Status: Pending

## Implementation Goal

Call ticket creation logic when payment succeeds.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
└── worker/src/lib/fulfillment.ts (new service function)
```

## Implementation Details

- Accept `{ orderId, userId, eventId }`
- Create tickets and mark order paid

## Verification Checklist

- [ ] Service callable from webhook handler
