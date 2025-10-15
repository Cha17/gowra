# Epic: Payments API Integration

Status: Completed

## Epic Scope

Integrate with NextAPI Partners to create an account and generate Payment Intents that return base64-encoded QR images for PHP/QRPH. Provide Worker endpoints to proxy/secure requests, handle Basic Auth, and normalize responses.

## Architecture Impact

Introduces payment API client in the Worker, secure credential handling, and consistent error mapping. Establishes foundation for subsequent checkout, webhook, and fulfillment flows.

## Stories in This Epic

| Story   | Technical Focus                             | Dependencies | Status    |
| ------- | ------------------------------------------- | ------------ | --------- |
| Story 1 | NextAPI client and auth config              | None         | Completed |
| Story 2 | Create Account endpoint                     | Story 1      | Completed |
| Story 3 | Create Payment Intent (QR base64, PHP/QRPH) | Story 1      | Completed |

## Technical Dependencies

### Prerequisites

- Sandbox credentials for NextAPI Partners
- Worker project configured

### Provides For

- Epic 2 (Checkout and Order Model)
- Epic 3 (Webhooks and Fulfillment)

## Integration Requirements

- Basic Auth header construction using Client ID/Secret
- Endpoints: Create Account, Create Payment Intent
- Return base64 QR image string in API response

## Technical Risks

- Risk: Incorrect QR format or encoding
  - Impact: Client cannot scan for payment
  - Mitigation: Validate MIME prefix and test with sample payloads

## Definition of Done

- [x] Worker can call NextAPI with Basic Auth
- [x] Account creation endpoint operational
- [x] Payment Intent returns base64 QR string for PHP/QRPH
