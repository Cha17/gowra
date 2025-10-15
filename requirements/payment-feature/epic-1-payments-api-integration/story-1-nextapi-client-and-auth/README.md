# Story: NextAPI Client and Auth Config

Status: Completed

## Story Purpose

Implement a minimal client in the Worker to call NextAPI Partners using Basic Auth with sandbox credentials, ready to be used by account and payment intent endpoints.

## Acceptance Criteria

- [x] Env vars loaded in Worker for sandbox Client ID/Secret and base URL
- [x] Basic Auth header created correctly and applied to requests
- [x] Shared HTTP utility with error normalization

## Technical Specifications

### API Contracts

```yaml
paths:
  /payments/_internal/health:
    get:
      summary: Health probe for NextAPI client
      responses:
        "200": { description: OK }
```

### Component Interfaces

```typescript
export interface NextApiClientConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
}
```

## Implementation Tasks

- task-1-setup-env-and-config.md: Define env vars and config loader
- task-2-http-client-and-auth.md: Implement fetch wrapper with Basic Auth
- task-3-testing.md: Unit tests for header creation and error mapping

## Testing Requirements

### Unit Test Coverage

- Config loader returns expected values
- Authorization header is `Basic base64(clientId:clientSecret)`
- Error normalization returns typed errors for 4xx/5xx

### Integration Points

- N/A in this story

## Dependencies

- **Requires**: None
- **Enables**: Story 2, Story 3
