// Environment configuration for different deployment environments

export const environment = {
  // Current environment (development, staging, production)
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // API URLs for different environments
  API_URLS: {
    development: 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev',
    staging: 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev', 
    production: 'https://gowwra-api-worker-production.charlcrtz17.workers.dev', // Update this with your actual production URL
  },
  
  // Get the current API URL based on environment
  getApiUrl: () => {
    // Check if we have an explicit environment variable
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    
    // Fallback to environment-based URL
    const env = process.env.NODE_ENV || 'development';
    return environment.API_URLS[env as keyof typeof environment.API_URLS] || environment.API_URLS.development;
  },
  
  // Easy switching for testing
  STAGING_API: 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev',
  PRODUCTION_API: 'https://gowwra-api-worker-production.charlcrtz17.workers.dev', // Update this
  
  // Feature flags for testing
  FEATURES: {
    ORGANIZER_ROLE: true, // Enable organizer features
    DEBUG_MODE: process.env.NODE_ENV === 'development',
  }
};

// Helper to check if we're in development
export const isDevelopment = () => environment.NODE_ENV === 'development';

// Helper to check if we're using staging API
export const isUsingStaging = () => environment.getApiUrl().includes('staging');

// Helper to switch to staging API (for testing)
export const useStagingApi = () => environment.STAGING_API;

// Helper to switch to production API  
export const useProductionApi = () => environment.PRODUCTION_API;
