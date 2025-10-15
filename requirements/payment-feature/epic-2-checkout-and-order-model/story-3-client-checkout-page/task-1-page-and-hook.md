# Task: Create Checkout Page and Hook

Status: Pending

## Implementation Goal

Add `/checkout/[orderId]` page and a `useCheckout(orderId)` hook to create/fetch checkout.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
└── client/app/checkout/[orderId]/page.tsx (new)
```

### Component Structure

```tsx
export default function CheckoutPage({
  params,
}: {
  params: { orderId: string };
});
```

## Implementation Details

- On mount, POST /api/checkout if no active checkout
- Store and expose `checkoutId`, `qrBase64`, `status`

## Testing Specification

- Renders QR on happy path
- Handles errors gracefully

## Verification Checklist

- [ ] Page renders with QR for valid order
