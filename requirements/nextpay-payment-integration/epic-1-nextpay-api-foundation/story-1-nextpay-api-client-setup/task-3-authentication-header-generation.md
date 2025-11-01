# Task 3: Authentication Header Generation

Status: Pending

## Task Purpose

Implement secure Basic Authentication header generation for NextPay API requests, ensuring proper credential encoding and security.

## Implementation Details

### Authentication Implementation

```typescript
// worker/src/lib/nextpay/auth.ts
export interface AuthCredentials {
  clientId: string;
  clientSecret: string;
}

export class NextPayAuthenticator {
  constructor(private credentials: AuthCredentials) {}

  generateAuthHeader(): string {
    const credentials = `${this.credentials.clientId}:${this.credentials.clientSecret}`;
    const encoded = btoa(credentials);
    return `Basic ${encoded}`;
  }

  validateCredentials(): boolean {
    return !!(this.credentials.clientId && this.credentials.clientSecret);
  }

  // For testing purposes - never expose in production
  getCredentialsHash(): string {
    const combined = `${this.credentials.clientId}:${this.credentials.clientSecret}`;
    return btoa(combined).slice(0, 8) + "...";
  }
}
```

### Integration with HTTP Client

```typescript
// worker/src/lib/nextpay/http-client.ts
export class NextPayHttpClientImpl implements NextPayHttpClient {
  private authenticator: NextPayAuthenticator;

  constructor(private config: NextPayConfig, private logger: Logger) {
    this.authenticator = new NextPayAuthenticator({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });
  }

  private buildHeaders(
    customHeaders?: Record<string, string>
  ): Record<string, string> {
    const authHeader = this.authenticator.generateAuthHeader();
    return {
      "Content-Type": "application/json",
      Authorization: authHeader,
      ...customHeaders,
    };
  }
}
```

## Acceptance Criteria

- [ ] Basic Auth header generated correctly
- [ ] Credentials properly encoded using base64
- [ ] Header format follows RFC 7617 standard
- [ ] Credential validation implemented
- [ ] Security best practices followed
- [ ] No credential exposure in logs

## Testing Requirements

- [ ] Auth header format is correct (`Basic <base64>`)
- [ ] Base64 encoding works properly
- [ ] Credential validation functions correctly
- [ ] No sensitive data exposed in logs
- [ ] Edge cases handled (empty credentials, special characters)

## Files to Create/Modify

- `worker/src/lib/nextpay/auth.ts` - Authentication implementation
- `worker/src/lib/nextpay/__tests__/auth.test.ts` - Unit tests

## Dependencies

- Task 1: Environment Configuration Setup

## Security Considerations

- Never log actual credentials
- Use secure credential storage
- Validate credentials before use
- Implement proper error handling for auth failures

## Notes

- Follow RFC 7617 for Basic Authentication
- Ensure proper encoding of special characters
- Add credential validation for security
- Consider implementing credential rotation support
