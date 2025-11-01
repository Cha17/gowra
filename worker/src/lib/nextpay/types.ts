// NextPay API Types and Interfaces

export interface NextPayConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  timeout: number;
  retryAttempts: number;
  accountId?: string;
}

export interface NextPayHttpClient {
  get<T>(endpoint: string, options?: RequestOptions): Promise<T>;
  post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T>;
  put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T>;
  delete<T>(endpoint: string, options?: RequestOptions): Promise<T>;
}

export interface RequestOptions {
  timeout?: number;
  retryAttempts?: number;
  headers?: Record<string, string>;
}

export interface NextPayApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

export interface AuthCredentials {
  clientId: string;
  clientSecret: string;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: ErrorDetails;
  performance?: PerformanceMetrics;
}

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  FATAL = "FATAL",
}

export interface ErrorDetails {
  type: string;
  code?: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  memoryUsage?: number;
  apiCalls?: number;
}

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

export interface CreatePaymentIntentRequest {
  accountId: string;
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
}

export interface PaymentIntentResponse {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  description: string;
  status: PaymentIntentStatus;
  qrCode: string; // Base64 encoded QR code
  qrCodeUrl?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export enum PaymentIntentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export interface NextPayClient {
  createAccount(accountData: CreateAccountRequest): Promise<AccountResponse>;
  createPaymentIntent(intentData: CreatePaymentIntentRequest): Promise<PaymentIntentResponse>;
  getAccount(accountId: string): Promise<AccountResponse>;
  getPaymentIntent(intentId: string): Promise<PaymentIntentResponse>;
}
