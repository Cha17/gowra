# Task: Testing for Client and Auth

Status: Pending

## Implementation Goal

Provide unit test specification for NextAPI client config and auth header logic.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
└── worker/src/lib/__tests__/nextapiClient.test.ts (new)
```

## Testing Specification

### Test Cases to Implement

- Creates Basic header from clientId and clientSecret
- Sends JSON and parses JSON response
- Maps status codes to structured errors

### Test Data Requirements

- Dummy env values for base URL, client ID/secret

## Verification Checklist

- [ ] All tests pass
- [ ] Edge cases covered for 401/500
