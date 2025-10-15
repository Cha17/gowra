# Task: Implement POST /payments/webhook

Status: Pending

## Implementation Goal

Add webhook route in Worker and parse JSON payloads.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
└── worker/src/routes/webhook.ts (new or within payments route)
```

### API Implementation

```http
POST /api/payments/webhook
```

## Implementation Details

- Read raw body if signature requires exact bytes
- Return 200 on accepted events

## Verification Checklist

- [ ] Route exists and returns 200
