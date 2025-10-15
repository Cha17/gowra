# Story: Ticket Issuance Integration

Status: Completed

## Story Purpose

Issue tickets immediately when a payment succeeds. Integrate with existing ticket creation flow.

## Acceptance Criteria

- [x] On 'succeeded', mark order paid and create tickets for the user/event
- [x] Ensure idempotent ticket creation (no duplicates)
- [x] Return confirmation for client redirect

## Technical Specifications

### Component Interfaces

```typescript
export interface IssueTicketsInput {
  orderId: string;
  userId: string;
  eventId: string;
  quantity?: number;
}
```

## Implementation Tasks

- task-1-service-wireup.md: Call ticket service from webhook handler
- task-2-idempotent-creation.md: Guard against duplicates
- task-3-testing.md: End-to-end happy path

## Dependencies

- **Requires**: Status updates and idempotency
- **Enables**: End-to-end payment flow
