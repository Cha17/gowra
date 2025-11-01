# Story 2: Account Management Integration

Status: Pending

## Story Purpose

Implement NextPay account management functionality, enabling the creation and management of payment accounts for the Gowra platform. This includes account creation, retrieval, and status management.

## Acceptance Criteria

- [ ] Account creation endpoint implemented
- [ ] Account retrieval functionality
- [ ] Account status management
- [ ] Integration with existing user system
- [ ] Proper error handling for account operations
- [ ] Account data validation and security

## Technical Specifications

### Account Management Interface

```typescript
export interface CreateAccountRequest {
  name: string;
  email: string;
  phone?: string;
  address?: Address;
  metadata?: Record<string, any>;
}

export interface AccountResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: Address;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export enum AccountStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  PENDING = "PENDING",
}
```

### Account Service Implementation

```typescript
export class NextPayAccountService {
  constructor(
    private client: NextPayClient,
    private db: DatabaseClient,
    private logger: Logger
  ) {}

  async createAccount(
    userId: string,
    accountData: CreateAccountRequest
  ): Promise<AccountResponse> {
    // Validate account data
    this.validateAccountData(accountData);

    // Check if user already has an account
    const existingAccount = await this.getAccountByUserId(userId);
    if (existingAccount) {
      throw new Error("User already has a payment account");
    }

    // Create account via NextPay API
    const accountResponse = await this.client.createAccount(accountData);

    // Store account reference in database
    await this.storeAccountReference(userId, accountResponse.id);

    return accountResponse;
  }

  async getAccount(accountId: string): Promise<AccountResponse> {
    return await this.client.getAccount(accountId);
  }

  async getAccountByUserId(userId: string): Promise<AccountResponse | null> {
    const accountRef = await this.db
      .selectFrom("user_accounts")
      .select("account_id")
      .where("user_id", "=", userId)
      .executeTakeFirst();

    if (!accountRef) {
      return null;
    }

    return await this.getAccount(accountRef.account_id);
  }

  private validateAccountData(data: CreateAccountRequest): void {
    if (!data.name || !data.email) {
      throw new Error("Name and email are required");
    }

    if (!this.isValidEmail(data.email)) {
      throw new Error("Invalid email format");
    }
  }

  private async storeAccountReference(
    userId: string,
    accountId: string
  ): Promise<void> {
    await this.db
      .insertInto("user_accounts")
      .values({
        user_id: userId,
        account_id: accountId,
        created_at: new Date(),
      })
      .execute();
  }
}
```

## Implementation Tasks

- **Task 1**: Account Data Models and Validation
- **Task 2**: Account Creation Implementation
- **Task 3**: Account Retrieval and Management
- **Task 4**: Database Schema Updates
- **Task 5**: Account Service Testing

## Testing Requirements

### Unit Test Coverage

- Account data validation
- Account creation flow
- Account retrieval operations
- Error handling scenarios
- Database operations

### Integration Testing

- End-to-end account creation
- Account management operations
- Error scenarios with NextPay API

## Dependencies

- **Requires**: Story 1 (NextPay API Client Setup)
- **Enables**: Story 3 (Payment Intent Creation)

## Technical Notes

- Implement proper data validation
- Add comprehensive error handling
- Ensure account data security
- Add logging for all operations
- Consider account status synchronization
