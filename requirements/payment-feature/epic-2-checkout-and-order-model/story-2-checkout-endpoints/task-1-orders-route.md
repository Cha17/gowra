# Task: Implement POST /orders

Status: Completed

## Implementation Goal

Create a new order (pending) with eventId, userId, totalAmount, currency.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
└── worker/src/routes/orders.ts (new or within existing route group)
```

### API Implementation

```http
POST /api/orders
```

Body:

```json
{ "eventId": "...", "userId": "...", "totalAmount": 10000, "currency": "PHP" }
```

## Implementation Details

- Validate event and user exist if applicable
- Status defaults to `pending`

## Testing Specification

- Create order; fetch by id; verify fields

## Verification Checklist

- [x] 201 response with created order
