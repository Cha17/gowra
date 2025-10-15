# Story: Client Checkout Page (QR Rendering)

Status: In Progress

## Story Purpose

Add a Next.js page to display the base64 QR for an order checkout and poll its status until paid.

## Acceptance Criteria

- [ ] Page at /checkout/[orderId]
- [ ] Calls POST /checkout to create a checkout if needed
- [ ] Renders QR from base64 string as <img src="data:image/png;base64,..." />
- [ ] Polls GET /checkout/:id until status becomes succeeded, then navigates to ticket issuance confirmation

## Technical Specifications

### Component Interfaces

```typescript
interface CheckoutViewProps {
  orderId: string;
}
```

### Frontend Components

```tsx
// Displays QR and status
```

## Implementation Tasks

- task-1-page-and-hook.md: Create page and useCheckout hook
- task-2-ui-and-polling.md: Render QR and implement polling
- task-3-testing.md: UI tests and happy path flow

## Dependencies

- **Requires**: Epic 2 checkout endpoints
- **Enables**: Fulfillment after success
