import { tokenManager } from './auth';
import { environment } from '../config/environment';

const API_BASE_URL: string = environment.getApiUrl();

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = tokenManager.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    let data: any;
    let responseText: string = '';
    try {
      responseText = await response.text();
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Raw response:', responseText || '(empty)');
      data = { 
        success: false,
        message: 'Request failed - invalid JSON response',
        error: 'Invalid JSON response from server',
        rawResponse: responseText || '(no response)',
        status: response.status,
        statusText: response.statusText
      };
    }

    // Handle 401 errors with automatic token refresh (only retry once)
    if (response.status === 401 && retryCount === 0) {
      console.log('🔄 Received 401, attempting token refresh...');
      
      // Try to refresh the token
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${this.baseUrl}/api/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });

          const refreshData = await refreshResponse.json();
          
          if (refreshData.success && refreshData.token) {
            console.log('✅ Token refreshed successfully, retrying request...');
            tokenManager.setAccessToken(refreshData.token);
            // Retry the original request with new token
            return this.request<T>(endpoint, options, retryCount + 1);
          } else {
            console.log('❌ Token refresh failed, clearing tokens');
            tokenManager.removeTokens();
          }
        } catch (refreshError) {
          console.error('❌ Token refresh error:', refreshError);
          tokenManager.removeTokens();
        }
      } else {
        console.log('❌ No refresh token available');
        tokenManager.removeTokens();
      }
    }

    if (!response.ok) {
      // For API responses that follow the { success: false, error: string } pattern,
      // we should still return the data so the client can handle it
      if (data.success === false) {
        return data;
      }
      // For other error responses, throw an error with more details
      const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Method for handling API responses that might return error status but still have useful data
  async postWithErrorHandling<T>(endpoint: string, data?: any, retryCount = 0): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      method: 'POST',
      headers: { ...headers },
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseData = await response.json().catch((error) => {
      console.error('Failed to parse JSON response:', error);
      return { 
        success: false, 
        error: 'Invalid response format',
        message: 'Server returned invalid JSON'
      };
    });

    // Handle 401 errors with automatic token refresh (only retry once)
    if (response.status === 401 && retryCount === 0) {
      console.log('🔄 Received 401 in postWithErrorHandling, attempting token refresh...');
      
      // Try to refresh the token
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${this.baseUrl}/api/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });

          const refreshData = await refreshResponse.json();
          
          if (refreshData.success && refreshData.token) {
            console.log('✅ Token refreshed successfully, retrying request...');
            tokenManager.setAccessToken(refreshData.token);
            // Retry the original request with new token
            return this.postWithErrorHandling<T>(endpoint, data, retryCount + 1);
          } else {
            console.log('❌ Token refresh failed, clearing tokens');
            tokenManager.removeTokens();
          }
        } catch (refreshError) {
          console.error('❌ Token refresh error:', refreshError);
          tokenManager.removeTokens();
        }
      } else {
        console.log('❌ No refresh token available');
        tokenManager.removeTokens();
      }
    }
    
    // Convert error responses to the expected format
    if (!response.ok) {
      return {
        success: false,
        error: responseData.error || responseData.message || `HTTP error! status: ${response.status}`,
        message: responseData.message || responseData.error
      } as T;
    }
    
    // For successful responses, ensure they have the expected structure
    if (responseData.success === false) {
      return {
        success: false,
        error: responseData.error || responseData.message || 'Request failed',
        message: responseData.message || responseData.error
      } as T;
    }
    
    // Always return the response data, regardless of status
    return responseData;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

export const API_ENDPOINTS = {
  // Auth endpoints
  login: '/api/auth/login',
  register: '/api/auth/register',
  logout: '/api/auth/logout',
  refresh: '/api/auth/refresh',
  me: '/api/auth/me',
  upgradeToOrganizer: '/api/auth/upgrade-to-organizer',
  
  // Event endpoints
  events: '/api/events',
  event: (id: string) => `/api/events/${id}`,
  myEvents: '/api/events/my-events',
  dashboardAnalytics: '/api/events/dashboard-analytics',
  
  // Admin endpoints (if needed)
  admin: '/api/admin',
  
  // Payment Processing endpoints
  paymentProcessing: {
    createPaymentIntent: (registrationId: string) => `/api/payment-processing/registration/${registrationId}/payment-intent`,
    getPaymentStatus: (registrationId: string) => `/api/payment-processing/registration/${registrationId}/payment-status`,
    pollPaymentStatus: (paymentIntentId: string) => `/api/payment-processing/payment-intent/${paymentIntentId}/poll`,
    retryPayment: (registrationId: string) => `/api/payment-processing/registration/${registrationId}/retry-payment`,
    getRetryInfo: (registrationId: string) => `/api/payment-processing/registration/${registrationId}/retry-info`,
    validateQRCode: '/api/payment-processing/qr-code/validate',
    generateQRMetadata: '/api/payment-processing/qr-code/metadata',
    batchUpdateStatuses: '/api/payment-processing/payment-statuses/batch-update',
  },
  
  // NextPay endpoints
  nextpay: {
    health: '/api/nextpay/health',
    testAccount: '/api/nextpay/test-account',
    testPaymentIntent: '/api/nextpay/test-payment-intent',
    getAccount: (accountId: string) => `/api/nextpay/test-account/${accountId}`,
    getPaymentIntent: (intentId: string) => `/api/nextpay/test-payment-intent/${intentId}`,
  },
  
  // Webhook endpoints
  webhook: {
    nextpay: '/api/webhook/nextpay',
    health: '/api/webhook/health',
    logs: '/api/webhook/logs',
    stats: '/api/webhook/stats',
    test: '/api/webhook/test',
  },
};