# Task: HTTP Client and Basic Auth

Status: Completed

## Implementation Goal

Create a typed fetch wrapper that injects Basic Auth using env config and normalizes errors.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
└── worker/src/lib/nextapiClient.ts (new)
```

### API Implementation

```typescript
export interface HttpErrorInfo {
  status: number;
  code?: string;
  message: string;
}
export async function nextApiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T>;
```

## Implementation Details

### Core Logic

- Build `Authorization: Basic base64(clientId:clientSecret)` header.
- Merge headers and JSON body handling.
- If response !ok, parse JSON error if available and throw structured error.

### Error Handling

- Map 401/403 to auth config issues; 4xx to validation; 5xx to upstream error.

## Testing Specification

### Test Cases to Implement

- Adds correct Authorization header
- Proper JSON serialization and content-type
- Error mapping for 401 and 500

## Verification Checklist

- [ ] Auth header built correctly
- [ ] Errors normalized
