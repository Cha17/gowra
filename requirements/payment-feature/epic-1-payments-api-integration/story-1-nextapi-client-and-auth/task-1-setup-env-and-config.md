# Task: Setup Env and Config

Status: Completed

## Implementation Goal

Define worker env variables and a config loader for NextAPI sandbox.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
├── worker/.dev.vars (add NEXTAPI_* vars)
└── worker/src/lib/nextapiConfig.ts (new)
```

### Configuration Changes

```bash
# worker/.dev.vars
NEXTAPI_BASE_URL=https://sandbox.nextapi.example.com
NEXTAPI_CLIENT_ID=your_sandbox_client_id
NEXTAPI_CLIENT_SECRET=your_sandbox_client_secret
```

## Implementation Details

### Core Logic

- Export `getNextApiClientConfig(env: Env)` that returns baseUrl, clientId, clientSecret.
- Validate presence; throw descriptive errors in dev.
- create the Env type for these variables
  DATABASE_URL
  JWT_SECRET
  JWT_REFRESH_SECRET
  ADMIN_EMAILS
  ENVIRONMENT
  CHECKOUT_ENABLED
  PAYMENT_SUCCESS_URL
  PAYMENT_CANCEL_URL
  CHECKOUT_ENABLED
  PAYMENT_SUCCESS_URL
  PAYMENT_CANCEL_URL
  CLIENT_URL
  CLIENT_URL
  NEXTPAY_API_KEY
  NEXTPAY_SECRET_KEY

## Testing Specification

### Test Cases to Implement

- Missing env var throws error
- Correct values returned when present

## Verification Checklist

- [ ] Env vars exist in `.dev.vars`
- [ ] Config loader compiles and is importable
