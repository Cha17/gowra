import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadNextPayConfig, validateNextPayEnv } from "../config";
import type { EnvBinding } from "../../../schema/env";

describe("NextPay Config", () => {
  let mockEnv: EnvBinding;

  beforeEach(() => {
    mockEnv = {
      ENVIRONMENT: "development",
      DATABASE_URL: "postgresql://test",
      JWT_SECRET: "test-secret",
      JWT_REFRESH_SECRET: "test-refresh-secret",
      ADMIN_EMAILS: "admin@test.com",
      NEXTAPI_BASE_URL: "https://api.partners.nextpay.world",
      NEXTPAY_API_KEY: "test-client-id",
      NEXTPAY_SECRET_KEY: "test-client-secret",
      NEXTPAY_TIMEOUT: 30000,
      NEXTPAY_RETRY_ATTEMPTS: 3,
      NEXTPAY_ACCOUNT_ID: "test-account-id",
    } as EnvBinding;
  });

  it("should load configuration correctly", () => {
    const config = loadNextPayConfig(mockEnv);

    expect(config.baseUrl).toBe("https://api.partners.nextpay.world");
    expect(config.clientId).toBe("test-client-id");
    expect(config.clientSecret).toBe("test-client-secret");
    expect(config.timeout).toBe(30000);
    expect(config.retryAttempts).toBe(3);
    expect(config.accountId).toBe("test-account-id");
  });

  it("should use default values for optional fields", () => {
    const envWithoutDefaults = {
      ...mockEnv,
    };
    delete (envWithoutDefaults as any).NEXTPAY_TIMEOUT;
    delete (envWithoutDefaults as any).NEXTPAY_RETRY_ATTEMPTS;

    const config = loadNextPayConfig(envWithoutDefaults as EnvBinding);

    expect(config.timeout).toBe(30000);
    expect(config.retryAttempts).toBe(3);
  });

  it("should validate required fields", () => {
    const invalidEnv = {
      ...mockEnv,
      NEXTAPI_BASE_URL: "",
      NEXTPAY_API_KEY: "",
    } as EnvBinding;

    expect(() => loadNextPayConfig(invalidEnv)).toThrow();
  });

  it("should validate environment variables", () => {
    expect(validateNextPayEnv(mockEnv)).toBe(true);
    
    const incompleteEnv = {
      NEXTAPI_BASE_URL: "https://api.partners.nextpay.world",
      NEXTPAY_API_KEY: "test-client-id",
      // Missing NEXTPAY_SECRET_KEY
    } as Partial<EnvBinding>;

    expect(validateNextPayEnv(incompleteEnv)).toBe(false);
  });

  it("should validate URL format", () => {
    const invalidUrlEnv = {
      ...mockEnv,
      NEXTAPI_BASE_URL: "not-a-valid-url",
    } as EnvBinding;

    expect(() => loadNextPayConfig(invalidUrlEnv)).toThrow();
  });

  it("should validate timeout range", () => {
    const invalidTimeoutEnv = {
      ...mockEnv,
      NEXTPAY_TIMEOUT: 500, // Too low
    } as EnvBinding;

    expect(() => loadNextPayConfig(invalidTimeoutEnv)).toThrow();

    const invalidTimeoutEnv2 = {
      ...mockEnv,
      NEXTPAY_TIMEOUT: 70000, // Too high
    } as EnvBinding;

    expect(() => loadNextPayConfig(invalidTimeoutEnv2)).toThrow();
  });

  it("should validate retry attempts range", () => {
    const invalidRetryEnv = {
      ...mockEnv,
      NEXTPAY_RETRY_ATTEMPTS: 0, // Too low
    } as EnvBinding;

    expect(() => loadNextPayConfig(invalidRetryEnv)).toThrow();

    const invalidRetryEnv2 = {
      ...mockEnv,
      NEXTPAY_RETRY_ATTEMPTS: 15, // Too high
    } as EnvBinding;

    expect(() => loadNextPayConfig(invalidRetryEnv2)).toThrow();
  });
});
