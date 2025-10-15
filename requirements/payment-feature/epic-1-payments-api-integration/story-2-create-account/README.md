# Story: Create Account Endpoint

Status: Completed

## Story Purpose

Expose a Worker endpoint that creates an Account via NextAPI Partners and returns normalized account data.

## Acceptance Criteria

- [x] POST /payments/account creates account upstream and returns 201
- [x] Input validation and error mapping implemented
- [x] Response includes account id and status

## Technical Specifications

### API Contracts

```yaml
paths:
  /payments/account:
    post:
      summary: Create an upstream payment account
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                businessName: { type: string }
                contactEmail: { type: string, format: email }
              required: [businessName, contactEmail]
      responses:
        "201":
          description: Created
          content:
            application/json:
              schema:
                type: object
                properties:
                  accountId: { type: string }
                  status: { type: string }
```

## Implementation Tasks

- task-1-worker-route.md: Implement /payments/account route
- task-2-upstream-call.md: Call NextAPI create account and map response
- task-3-testing.md: Contract and error tests

## Dependencies

- **Requires**: Story 1 client and auth
- **Enables**: Payment Intent creation
