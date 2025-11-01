import type { 
  CreateAccountRequest, 
  AccountResponse, 
  NextPayClient 
} from "./types";
import type { DatabaseClient } from "../../db/types";
import type { Logger } from "./http-client";

/**
 * NextPay Account Service handles account management operations
 */
export class NextPayAccountService {
  constructor(
    private client: NextPayClient,
    private db: DatabaseClient,
    private logger: Logger
  ) {}

  /**
   * Creates a new NextPay account for a user
   * @param userId - User ID
   * @param accountData - Account creation data
   * @returns Created account information
   */
  async createAccount(
    userId: string,
    accountData: CreateAccountRequest
  ): Promise<AccountResponse> {
    this.logger.info("Creating NextPay account", { 
      userId, 
      email: accountData.email,
      name: accountData.name 
    });

    // Validate account data
    this.validateAccountData(accountData);

    // Check if user already has an account
    const existingAccount = await this.getAccountByUserId(userId);
    if (existingAccount) {
      throw new Error("User already has a payment account");
    }

    try {
      this.logger.info("Attempting to create account via NextPay API", {
        userId,
        email: accountData.email,
        name: accountData.name,
        accountData
      });
      
      // Create account via NextPay API
      const accountResponse = await this.client.createAccount(accountData);

      this.logger.info("Account created successfully via NextPay API", { 
        userId,
        accountId: accountResponse.id,
        status: accountResponse.status 
      });

      // Store account reference in database
      await this.storeAccountReference(userId, accountResponse.id);

      this.logger.info("Account stored in database", { 
        userId,
        accountId: accountResponse.id
      });

      return accountResponse;
    } catch (error) {
      this.logger.error("Failed to create account", { 
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorName: error instanceof Error ? error.name : undefined,
        userId,
        email: accountData.email,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });
      throw error;
    }
  }

  /**
   * Retrieves account information by account ID
   * @param accountId - Account ID
   * @returns Account information
   */
  async getAccount(accountId: string): Promise<AccountResponse> {
    this.logger.info("Retrieving NextPay account", { accountId });

    try {
      const account = await this.client.getAccount(accountId);
      
      this.logger.info("Account retrieved successfully", { 
        accountId: account.id,
        status: account.status 
      });
      
      return account;
    } catch (error) {
      this.logger.error("Failed to retrieve account", { 
        error: error instanceof Error ? error.message : String(error),
        accountId 
      });
      throw error;
    }
  }

  /**
   * Retrieves account information by user ID
   * @param userId - User ID
   * @returns Account information or null if not found
   */
  async getAccountByUserId(userId: string): Promise<AccountResponse | null> {
    this.logger.info("Retrieving account by user ID", { userId });

    try {
      const accountRef = await this.db
        .selectFrom("user_accounts")
        .select("account_id")
        .where("user_id", "=", userId)
        .executeTakeFirst();

      if (!accountRef) {
        this.logger.info("No account found for user", { userId });
        return null;
      }

      const account = await this.getAccount(accountRef.account_id);
      
      this.logger.info("Account retrieved by user ID", { 
        userId,
        accountId: account.id,
        status: account.status 
      });
      
      return account;
    } catch (error) {
      this.logger.error("Failed to retrieve account by user ID", { 
        error: error instanceof Error ? error.message : String(error),
        userId 
      });
      throw error;
    }
  }

  /**
   * Checks if a user has a NextPay account
   * @param userId - User ID
   * @returns true if user has an account
   */
  async hasAccount(userId: string): Promise<boolean> {
    try {
      const accountRef = await this.db
        .selectFrom("user_accounts")
        .select("id")
        .where("user_id", "=", userId)
        .executeTakeFirst();

      return !!accountRef;
    } catch (error) {
      this.logger.error("Failed to check if user has account", { 
        error: error instanceof Error ? error.message : String(error),
        userId 
      });
      throw error;
    }
  }

  /**
   * Validates account creation data
   * @param data - Account data to validate
   * @throws Error if validation fails
   */
  private validateAccountData(data: CreateAccountRequest): void {
    if (!data.name || !data.email) {
      throw new Error("Name and email are required");
    }

    if (!this.isValidEmail(data.email)) {
      throw new Error("Invalid email format");
    }

    if (data.name.trim().length < 2) {
      throw new Error("Name must be at least 2 characters long");
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      throw new Error("Invalid phone number format");
    }
  }

  /**
   * Validates email format
   * @param email - Email to validate
   * @returns true if email is valid
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates phone number format
   * @param phone - Phone number to validate
   * @returns true if phone is valid
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Stores account reference in database
   * @param userId - User ID
   * @param accountId - NextPay account ID
   */
  private async storeAccountReference(userId: string, accountId: string): Promise<void> {
    try {
      await this.db
        .insertInto("user_accounts")
        .values({
          user_id: userId,
          account_id: accountId,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .execute();

      this.logger.info("Account reference stored", { userId, accountId });
    } catch (error) {
      this.logger.error("Failed to store account reference", { 
        error: error instanceof Error ? error.message : String(error),
        userId, 
        accountId 
      });
      throw error;
    }
  }
}
