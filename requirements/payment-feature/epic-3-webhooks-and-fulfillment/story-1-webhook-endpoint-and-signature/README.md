# Story: Webhook Endpoint and Signature Check

Status: Completed

## Story Purpose

Create a Worker webhook endpoint to receive payment events from NextAPI, validate authenticity, and parse payloads safely.

## Acceptance Criteria

- [x] POST /payments/webhook implemented in Worker
- [x] Signature/secret validation performed; unauthorized requests rejected
- [x] Payload schema validated; unknown events ignored safely

## Technical Specifications

### API Contracts

```yaml
paths:
  /payments/webhook:
    post:
      summary: Receive payment events
      responses:
        "200": { description: OK }
        "400": { description: Bad Request }
        "401": { description: Unauthorized }
```

## Implementation Tasks

- task-1-route.md: Implement webhook route with secret check
- task-2-validate-payload.md: Define schema and safe parsing
- task-3-testing.md: Replay and bad-signature tests

## Dependencies

- **Requires**: Epic 1 client auth config
- **Enables**: Status updates and fulfillment
