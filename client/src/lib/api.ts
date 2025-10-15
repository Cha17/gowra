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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    const data = await response.json().catch(() => ({ message: 'Request failed' }));

    if (!response.ok) {
      // For API responses that follow the { success: false, error: string } pattern,
      // we should still return the data so the client can handle it
      if (data.success === false) {
        return data;
      }
      // For other error responses, throw an error
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
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
  async postWithErrorHandling<T>(endpoint: string, data?: any): Promise<T> {
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
};