// Admin API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Admin API response types
export interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  totalRegistrations: number;
  totalRevenue: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminEvent {
  id: string;
  name: string;
  organizer: string;
  details?: string;
  date: string;
  imageUrl?: string;
  venue: string;
  status: string;
  price: number;
  capacity?: number;
  registrationDeadline?: string;
  createdAt: string;
  updatedAt: string;
  registration_count: number;
}

export interface AdminRegistration {
  id: string;
  userId: string;
  eventId: string;
  paymentStatus: string;
  paymentReference?: string;
  paymentAmount: number;
  registrationDate: string;
  createdAt: string;
  user_email: string;
  user_name?: string;
  event_name: string;
  event_date: string;
}

// Admin API functions
export const adminApi = {
  // Get admin dashboard stats
  async getStats(token: string): Promise<{ success: boolean; stats?: AdminStats; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  },

  // Get all users
  async getUsers(token: string): Promise<{ success: boolean; users?: AdminUser[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  },

  // Get all events
  async getEvents(token: string): Promise<{ success: boolean; events?: AdminEvent[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/events`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  },

  // Get all registrations
  async getRegistrations(token: string): Promise<{ success: boolean; registrations?: AdminRegistration[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/registrations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  },

  // Create new event
  async createEvent(token: string, eventData: Partial<AdminEvent>): Promise<{ success: boolean; event?: AdminEvent; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  },

  // Update event
  async updateEvent(token: string, eventId: string, eventData: Partial<AdminEvent>): Promise<{ success: boolean; event?: AdminEvent; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  },

  // Delete event
  async deleteEvent(token: string, eventId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  },
};
