import type { AuthCredentials } from "./types";

/**
 * NextPay Authenticator handles Basic Authentication for NextPay API requests
 */
export class NextPayAuthenticator {
  constructor(private credentials: AuthCredentials) {}

  /**
   * Generates Basic Authentication header for NextPay API requests
   * @returns Authorization header string in format "Basic <base64>"
   */
  generateAuthHeader(): string {
    const credentials = `${this.credentials.clientId}:${this.credentials.clientSecret}`;
    const encoded = btoa(credentials);
    return `Basic ${encoded}`;
  }

  /**
   * Validates that credentials are present and non-empty
   * @returns true if credentials are valid
   */
  validateCredentials(): boolean {
    return !!(this.credentials.clientId && this.credentials.clientSecret);
  }

  /**
   * Gets a hash of credentials for logging purposes (never expose actual credentials)
   * @returns Truncated hash of credentials for debugging
   */
  getCredentialsHash(): string {
    const combined = `${this.credentials.clientId}:${this.credentials.clientSecret}`;
    return btoa(combined).slice(0, 8) + "...";
  }

  /**
   * Creates a new authenticator instance
   * @param clientId - NextPay client ID
   * @param clientSecret - NextPay client secret
   * @returns New NextPayAuthenticator instance
   */
  static create(clientId: string, clientSecret: string): NextPayAuthenticator {
    return new NextPayAuthenticator({ clientId, clientSecret });
  }
}
