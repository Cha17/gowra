// ===== PHASE 3, STEP 3.1: LOGGING MIDDLEWARE FOR DEBUGGING =====

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  duration?: number;
  error?: Error;
}

// Logger configuration
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logFilePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
  format: 'json' | 'text';
  includeTimestamp: boolean;
  includeRequestId: boolean;
  includeUserId: boolean;
  includePath: boolean;
  includeMethod: boolean;
  includeDuration: boolean;
}

// Default logger configuration
const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableFile: false,
  format: 'json',
  includeTimestamp: true,
  includeRequestId: true,
  includeUserId: false,
  includePath: true,
  includeMethod: true,
  includeDuration: true
};

// Logger class
export class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private bufferSize = 100;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // Log methods
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level > this.config.level) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };

    this.processLogEntry(entry);
  }

  // Process log entry
  private processLogEntry(entry: LogEntry): void {
    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.bufferSize) {
      this.logBuffer.shift();
    }

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // File logging
    if (this.config.enableFile && this.config.logFilePath) {
      this.logToFile(entry);
    }
  }

  // Console logging
  private logToConsole(entry: LogEntry): void {
    const levelEmoji = this.getLevelEmoji(entry.level);
    const levelName = LogLevel[entry.level];
    const timestamp = this.config.includeTimestamp ? `[${entry.timestamp}]` : '';
    const requestId = this.config.includeRequestId && entry.requestId ? `[${entry.requestId}]` : '';
    const userId = this.config.includeUserId && entry.userId ? `[User: ${entry.userId}]` : '';
    const path = this.config.includePath && entry.path ? `[${entry.path}]` : '';
    const method = this.config.includeMethod && entry.method ? `[${entry.method}]` : '';
    const duration = this.config.includeDuration && entry.duration ? `[${entry.duration}ms]` : '';

    const prefix = [timestamp, requestId, userId, path, method, duration].filter(Boolean).join(' ');
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';

    if (entry.level === LogLevel.ERROR) {
      console.error(`${levelEmoji} ${prefix} ${levelName}: ${entry.message}${contextStr}`);
      if (entry.error) {
        console.error('Error details:', entry.error);
      }
    } else if (entry.level === LogLevel.WARN) {
      console.warn(`${levelEmoji} ${prefix} ${levelName}: ${entry.message}${contextStr}`);
    } else if (entry.level === LogLevel.INFO) {
      console.info(`${levelEmoji} ${prefix} ${levelName}: ${entry.message}${contextStr}`);
    } else {
      console.log(`${levelEmoji} ${prefix} ${levelName}: ${entry.message}${contextStr}`);
    }
  }

  // File logging (basic implementation)
  private logToFile(entry: LogEntry): void {
    // This is a basic implementation
    // In production, you might want to use a proper logging library like winston or pino
    try {
      const fs = require('fs');
      const logLine = this.config.format === 'json' 
        ? JSON.stringify(entry) + '\n'
        : `${entry.timestamp} [${LogLevel[entry.level]}] ${entry.message}\n`;
      
      fs.appendFileSync(this.config.logFilePath!, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Get level emoji
  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR: return '❌';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.TRACE: return '🔎';
      default: return '📝';
    }
  }

  // Public logging methods
  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  trace(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.TRACE, message, context);
  }

  // Request logging
  logRequest(requestId: string, method: string, path: string, duration: number, statusCode: number, userId?: string): void {
    const level = statusCode >= 400 ? LogLevel.ERROR : statusCode >= 300 ? LogLevel.WARN : LogLevel.INFO;
    
    this.log(level, `${method} ${path} - ${statusCode}`, {
      requestId,
      method,
      path,
      duration,
      statusCode,
      userId
    });
  }

  // Error logging with context
  logError(error: Error, context?: Record<string, any>): void {
    this.error(error.message, {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });
  }

  // Performance logging
  logPerformance(operation: string, duration: number, context?: Record<string, any>): void {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG;
    
    this.log(level, `${operation} completed in ${duration}ms`, {
      operation,
      duration,
      ...context
    });
  }

  // Database operation logging
  logDatabase(operation: string, table: string, duration: number, success: boolean, context?: Record<string, any>): void {
    const level = success ? LogLevel.DEBUG : LogLevel.ERROR;
    const message = success 
      ? `Database ${operation} on ${table} completed in ${duration}ms`
      : `Database ${operation} on ${table} failed after ${duration}ms`;
    
    this.log(level, message, {
      operation,
      table,
      duration,
      success,
      ...context
    });
  }

  // Authentication logging
  logAuth(action: string, success: boolean, userId?: string, context?: Record<string, any>): void {
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    const message = success 
      ? `Authentication ${action} successful`
      : `Authentication ${action} failed`;
    
    this.log(level, message, {
      action,
      userId,
      success,
      ...context
    });
  }

  // Get log buffer
  getLogBuffer(): LogEntry[] {
    return [...this.logBuffer];
  }

  // Clear log buffer
  clearLogBuffer(): void {
    this.logBuffer = [];
  }

  // Update configuration
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create default logger instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  error: (message: string, context?: Record<string, any>) => logger.error(message, context),
  warn: (message: string, context?: Record<string, any>) => logger.warn(message, context),
  info: (message: string, context?: Record<string, any>) => logger.info(message, context),
  debug: (message: string, context?: Record<string, any>) => logger.debug(message, context),
  trace: (message: string, context?: Record<string, any>) => logger.trace(message, context),
  request: (requestId: string, method: string, path: string, duration: number, statusCode: number, userId?: string) => 
    logger.logRequest(requestId, method, path, duration, statusCode, userId),
  logError: (error: Error, context?: Record<string, any>) => logger.logError(error, context),
  performance: (operation: string, duration: number, context?: Record<string, any>) => 
    logger.logPerformance(operation, duration, context),
  database: (operation: string, table: string, duration: number, success: boolean, context?: Record<string, any>) => 
    logger.logDatabase(operation, table, duration, success, context),
    auth: (action: string, success: boolean, userId?: string, context?: Record<string, any>) =>
    logger.logAuth(action, success, userId, context)
};

// Export everything
export default logger;
