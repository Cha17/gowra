# Task: Implement POST /checkout

Status: Completed

## Implementation Goal

Create a checkout for an unpaid order; call /payments/intent and persist checkout with qrBase64 and paymentIntentId.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
└── worker/src/routes/checkout.ts (new or within payments route)
```

### API Implementation

```http
POST /api/checkout
```

Body:

```json
{ "orderId": "..." }
```

## Implementation Details

- Validate order exists and status = pending
- Create payment intent with amount/currency from order
- Insert checkout row with status `created`

## Testing Specification

- Attempt checkout on paid order -> 409
- Happy path returns qrBase64 and ids

## Verification Checklist

- [x] 201 response with `{ checkoutId, paymentIntentId, qrBase64 }`
