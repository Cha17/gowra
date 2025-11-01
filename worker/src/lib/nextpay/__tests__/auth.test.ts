import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextPayAuthenticator } from "../auth";

describe("NextPay Authenticator", () => {
  let authenticator: NextPayAuthenticator;

  beforeEach(() => {
    authenticator = new NextPayAuthenticator({
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
    });
  });

  it("should generate correct auth header", () => {
    const authHeader = authenticator.generateAuthHeader();
    const expected = `Basic ${btoa("test-client-id:test-client-secret")}`;
    expect(authHeader).toBe(expected);
  });

  it("should validate credentials correctly", () => {
    expect(authenticator.validateCredentials()).toBe(true);

    const invalidAuthenticator = new NextPayAuthenticator({
      clientId: "",
      clientSecret: "test-secret",
    });
    expect(invalidAuthenticator.validateCredentials()).toBe(false);

    const invalidAuthenticator2 = new NextPayAuthenticator({
      clientId: "test-id",
      clientSecret: "",
    });
    expect(invalidAuthenticator2.validateCredentials()).toBe(false);
  });

  it("should generate credentials hash for logging", () => {
    const hash = authenticator.getCredentialsHash();
    expect(hash).toMatch(/^.{8}\.\.\.$/);
    expect(hash).not.toContain("test-client-id");
    expect(hash).not.toContain("test-client-secret");
  });

  it("should create authenticator from static method", () => {
    const auth = NextPayAuthenticator.create("test-id", "test-secret");
    expect(auth.validateCredentials()).toBe(true);
    expect(auth.generateAuthHeader()).toBe(`Basic ${btoa("test-id:test-secret")}`);
  });

  it("should handle special characters in credentials", () => {
    const specialAuth = new NextPayAuthenticator({
      clientId: "test@client#id",
      clientSecret: "test$secret%key",
    });

    const authHeader = specialAuth.generateAuthHeader();
    const expected = `Basic ${btoa("test@client#id:test$secret%key")}`;
    expect(authHeader).toBe(expected);
  });
});
