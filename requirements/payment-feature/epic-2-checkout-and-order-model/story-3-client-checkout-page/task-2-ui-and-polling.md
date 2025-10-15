# Task: UI Rendering and Status Polling

Status: Pending

## Implementation Goal

Render base64 QR image and poll checkout status until succeeded.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
└── client/app/checkout/[orderId]/page.tsx (update)
```

### UI Behavior

- Show `<img src="data:image/png;base64,${qrBase64}" />`
- Poll GET /api/checkout/:id every 3–5 seconds
- Redirect to success page on `succeeded`

## Testing Specification

- Polling stops on success
- QR re-renders if new checkout is created

## Verification Checklist

- [ ] Polling works and stops correctly
