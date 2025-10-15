# Task: Implement GET /checkout/:id

Status: Completed

## Implementation Goal

Fetch a checkout with its status and QR (if still created) for display/polling.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
└── worker/src/routes/checkout.ts (same module)
```

### API Implementation

```http
GET /api/checkout/{id}
```

## Implementation Details

- Return minimal fields: id, orderId, paymentIntentId, status, qrBase64
- Hide qrBase64 if status != created

## Testing Specification

- Fetch existing checkout; verify payload
- Nonexistent id -> 404

## Verification Checklist

- [x] 200 response for valid id
