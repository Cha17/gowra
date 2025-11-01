import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import * as schema from './schema';
import { log } from '../lib/logger';

// ===== PHASE 3, STEP 3.2: DATABASE CONNECTION AND ORM SETUP =====

// Configure Neon for better performance
neonConfig.fetchConnectionCache = true;

// Connection pool configuration
const POOL_CONFIG = {
  maxConnections: 10,
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 10000, // 10 seconds
  maxUses: 7500, // Number of times a connection can be used before being destroyed
};

// Connection state tracking
interface ConnectionState {
  isConnected: boolean;
  lastHealthCheck: number;
  connectionCount: number;
  errorCount: number;
  lastError?: Error;
}

class DatabaseConnectionManager {
  private sql: any;
  private db: any;
  private state: ConnectionState;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private retryAttempts = 0;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.state = {
      isConnected: false,
      lastHealthCheck: 0,
      connectionCount: 0,
      errorCount: 0,
    };
    
    // Start initialization but don't wait for it
    this.initializationPromise = this.initializeConnection();
    this.startHealthCheck();
  }

  private async initializeConnection() {
    try {
      log.info('Initializing database connection...', { 
        url: this.getMaskedDatabaseUrl(),
        poolConfig: POOL_CONFIG 
      });

      // Create connection with retry logic
      await this.createConnectionWithRetry();
      
      this.state.isConnected = true;
      this.state.connectionCount++;
      this.state.errorCount = 0;
      
      log.info('Database connection established successfully', {
        connectionCount: this.state.connectionCount,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.handleConnectionError(error as Error);
    }
  }

  private async createConnectionWithRetry(): Promise<void> {
    while (this.retryAttempts < this.maxRetries) {
      try {
        this.sql = neon(process.env.DATABASE_URL!);
        this.db = drizzle(this.sql, { 
          schema,
          logger: process.env.NODE_ENV === 'development'
        });
        
        // Test the connection
        await this.testConnection();
        this.retryAttempts = 0; // Reset retry attempts on success
        return;
        
      } catch (error) {
        this.retryAttempts++;
        log.error(`Database connection attempt ${this.retryAttempts} failed`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          retryAttempts: this.retryAttempts,
          maxRetries: this.maxRetries
        });

        if (this.retryAttempts >= this.maxRetries) {
          throw new Error(`Failed to connect to database after ${this.maxRetries} attempts`);
        }

        // Wait before retrying with exponential backoff
        const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1);
        await this.sleep(delay);
      }
    }
  }

  private async testConnection(): Promise<void> {
    try {
      // Simple query to test connection
      await this.sql`SELECT 1 as test`;
      log.debug('Database connection test successful');
    } catch (error) {
      throw new Error(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleConnectionError(error: Error) {
    this.state.isConnected = false;
    this.state.errorCount++;
    this.state.lastError = error;
    
    log.error('Database connection error', {
      error: error.message,
      errorCount: this.state.errorCount,
      timestamp: new Date().toISOString()
    });

    // Attempt to reconnect after a delay
    setTimeout(() => {
      if (!this.state.isConnected) {
        log.info('Attempting to reconnect to database...');
        this.initializationPromise = this.initializeConnection();
      }
    }, 5000); // 5 second delay
  }

  private startHealthCheck() {
    // Health check every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000);
  }

  private async performHealthCheck() {
    try {
      if (!this.state.isConnected || !this.db) {
        log.warn('Database not connected, attempting reconnection...');
        this.initializationPromise = this.initializeConnection();
        return;
      }

      const startTime = Date.now();
      await this.sql`SELECT 1 as health_check`;
      const responseTime = Date.now() - startTime;

      this.state.lastHealthCheck = Date.now();
      
      log.debug('Database health check successful', {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      });

      // Log warning if response time is too high
      if (responseTime > 1000) {
        log.warn('Database health check slow response', {
          responseTime: `${responseTime}ms`,
          threshold: '1000ms'
        });
      }

    } catch (error) {
      log.error('Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      
      this.state.isConnected = false;
      this.initializationPromise = this.initializeConnection();
    }
  }

  private getMaskedDatabaseUrl(): string {
    const url = process.env.DATABASE_URL || '';
    if (url.length > 20) {
      return `${url.substring(0, 10)}...${url.substring(url.length - 10)}`;
    }
    return url;
  }

  // Public methods
  public async getConnection() {
    // Wait for initialization to complete
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
    
    if (!this.state.isConnected || !this.db) {
      throw new Error('Database not connected. Please check connection status.');
    }
    return this.db;
  }

  public async getRawConnection() {
    // Wait for initialization to complete
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
    
    if (!this.state.isConnected || !this.sql) {
      throw new Error('Database not connected. Please check connection status.');
    }
    return this.sql;
  }

  public getConnectionState(): ConnectionState {
    return { ...this.state };
  }

  public async executeQuery<T>(queryFn: () => Promise<T>): Promise<T> {
    if (!this.state.isConnected) {
      throw new Error('Database not connected');
    }

    const startTime = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      // Log slow queries
      if (duration > 1000) {
        log.warn('Slow database query detected', {
          duration: `${duration}ms`,
          threshold: '1000ms'
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error('Database query failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  public async closeConnection() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    this.state.isConnected = false;
    log.info('Database connection closed');
  }

  // Wait for connection to be ready
  public async waitForConnection(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }
}

// Create singleton instance
const dbManager = new DatabaseConnectionManager();

// Export connection manager for advanced usage
export { dbManager };

// Export the schema for use in migrations
export { schema }; 

// Export async getters for database connections
export const getDb = () => dbManager.getConnection();
export const getSql = () => dbManager.getRawConnection();

// Graceful shutdown
process.on('SIGTERM', async () => {
  log.info('SIGTERM received, closing database connection...');
  await dbManager.closeConnection();
});

process.on('SIGINT', async () => {
  log.info('SIGINT received, closing database connection...');
  await dbManager.closeConnection();
}); 