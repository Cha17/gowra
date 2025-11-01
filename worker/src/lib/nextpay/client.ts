import type { 
  NextPayClient, 
  CreateAccountRequest, 
  AccountResponse, 
  CreatePaymentIntentRequest, 
  PaymentIntentResponse 
} from "./types";
import { NextPayHttpClientImpl } from "./http-client";
import { NextPayLogger } from "./logger";
import { NextPayAccountService } from "./account-service";
import { NextPayPaymentIntentService } from "./payment-intent-service";
import { loadNextPayConfig } from "./config";
import type { EnvBinding } from "../../schema/env";
import type { DatabaseClient } from "../../db/types";

/**
 * Main NextPay Client Implementation
 */
export class NextPayClientImpl implements NextPayClient {
  private httpClient: NextPayHttpClientImpl;
  private logger: NextPayLogger;
  private accountService: NextPayAccountService;
  private paymentIntentService: NextPayPaymentIntentService;

  constructor(env: EnvBinding, db: DatabaseClient) {
    const config = loadNextPayConfig(env);
    this.logger = new NextPayLogger("nextpay-client", env.ENVIRONMENT);
    this.httpClient = new NextPayHttpClientImpl(config, this.logger);
    
    // Initialize services
    this.accountService = new NextPayAccountService(this, db, this.logger);
    this.paymentIntentService = new NextPayPaymentIntentService(this, db, this.logger);
  }

  /**
   * Creates a new account in NextPay
   * @param accountData - Account creation data
   * @returns Created account information
   */
  async createAccount(accountData: CreateAccountRequest): Promise<AccountResponse> {
    this.logger.info("Creating NextPay account", { 
      email: accountData.email,
      name: accountData.name 
    });

    try {
      const response = await this.httpClient.post<AccountResponse>("/v1/accounts", accountData);
      
      this.logger.info("Account created successfully", { 
        accountId: response.id,
        status: response.status 
      });
      
      return response;
    } catch (error) {
      this.logger.error("Failed to create account", error as Error, { 
        email: accountData.email 
      });
      throw error;
    }
  }

  /**
   * Retrieves account information by ID
   * @param accountId - Account ID
   * @returns Account information
   */
  async getAccount(accountId: string): Promise<AccountResponse> {
    this.logger.info("Retrieving NextPay account", { accountId });

    try {
      const response = await this.httpClient.get<AccountResponse>(`/v1/accounts/${accountId}`);
      
      this.logger.info("Account retrieved successfully", { 
        accountId: response.id,
        status: response.status 
      });
      
      return response;
    } catch (error) {
      this.logger.error("Failed to retrieve account", error as Error, { accountId });
      throw error;
    }
  }

  /**
   * Creates a payment intent for QR code generation
   * @param intentData - Payment intent data
   * @returns Payment intent with QR code
   */
  async createPaymentIntent(intentData: CreatePaymentIntentRequest): Promise<PaymentIntentResponse> {
    this.logger.info("Creating payment intent", { 
      accountId: intentData.accountId,
      amount: intentData.amount,
      currency: intentData.currency,
      orderId: intentData.orderId
    });

    try {
      const response = await this.httpClient.post<PaymentIntentResponse>("/v1/payment-intents", intentData);
      
      this.logger.info("Payment intent created successfully", { 
        intentId: response.id,
        status: response.status,
        hasQrCode: !!response.qrCode
      });
      
      return response;
    } catch (error) {
      this.logger.error("Failed to create payment intent", error as Error, { 
        accountId: intentData.accountId,
        orderId: intentData.orderId
      });
      throw error;
    }
  }

  /**
   * Retrieves payment intent information by ID
   * @param intentId - Payment intent ID
   * @returns Payment intent information
   */
  async getPaymentIntent(intentId: string): Promise<PaymentIntentResponse> {
    this.logger.info("Retrieving payment intent", { intentId });

    try {
      const response = await this.httpClient.get<PaymentIntentResponse>(`/v1/payment-intents/${intentId}`);
      
      this.logger.info("Payment intent retrieved successfully", { 
        intentId: response.id,
        status: response.status 
      });
      
      return response;
    } catch (error) {
      this.logger.error("Failed to retrieve payment intent", error as Error, { intentId });
      throw error;
    }
  }

  /**
   * Health check endpoint to verify API connectivity
   * @returns Health status
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    this.logger.debug("Performing health check");

    try {
      const response = await this.httpClient.get<{ status: string }>("/health");
      
      this.logger.info("Health check successful", { status: response.status });
      
      return {
        status: response.status,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error("Health check failed", error as Error);
      throw error;
    }
  }

  // Service methods
  
  /**
   * Creates a NextPay account for a user
   * @param userId - User ID
   * @param accountData - Account creation data
   * @returns Created account information
   */
  async createUserAccount(userId: string, accountData: CreateAccountRequest): Promise<AccountResponse> {
    return this.accountService.createAccount(userId, accountData);
  }

  /**
   * Gets account by user ID
   * @param userId - User ID
   * @returns Account information or null
   */
  async getUserAccount(userId: string): Promise<AccountResponse | null> {
    return this.accountService.getAccountByUserId(userId);
  }

  /**
   * Checks if user has a NextPay account
   * @param userId - User ID
   * @returns true if user has an account
   */
  async userHasAccount(userId: string): Promise<boolean> {
    return this.accountService.hasAccount(userId);
  }

  /**
   * Creates a payment intent for an order
   * @param orderId - Order ID
   * @param intentData - Payment intent data
   * @returns Payment intent with QR code
   */
  async createOrderPaymentIntent(orderId: string, intentData: CreatePaymentIntentRequest): Promise<PaymentIntentResponse> {
    return this.paymentIntentService.createPaymentIntent(orderId, intentData);
  }

  /**
   * Gets payment intent by order ID
   * @param orderId - Order ID
   * @returns Payment intent information or null
   */
  async getOrderPaymentIntent(orderId: string): Promise<PaymentIntentResponse | null> {
    return this.paymentIntentService.getPaymentIntentByOrderId(orderId);
  }

  /**
   * Updates payment intent status
   * @param intentId - Payment intent ID
   * @param status - New status
   */
  async updatePaymentIntentStatus(intentId: string, status: string): Promise<void> {
    return this.paymentIntentService.updatePaymentIntentStatus(intentId, status as any);
  }
}

/**
 * Factory function to create NextPay client
 * @param env - Environment binding
 * @param db - Database client
 * @returns NextPay client instance
 */
export function createNextPayClient(env: EnvBinding, db: DatabaseClient): NextPayClientImpl {
  return new NextPayClientImpl(env, db);
}
