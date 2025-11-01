import { LogLevel, type LogEntry, type ErrorDetails, type PerformanceMetrics } from "./types";

/**
 * NextPay Logger Implementation
 */
export class NextPayLogger {
  constructor(private service: string, private environment: string) {}

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  /**
   * Logs performance metrics
   * @param operation - Operation name
   * @param duration - Duration in milliseconds
   * @param context - Additional context
   */
  performance(operation: string, duration: number, context?: Record<string, any>): void {
    const metrics: PerformanceMetrics = {
      operation,
      duration,
      ...context,
    };
    
    this.log(LogLevel.INFO, `Performance: ${operation}`, { performance: metrics });
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context),
      error: error ? this.formatError(error) : undefined,
    };

    // In production, send to external logging service
    if (this.environment === "production") {
      this.sendToLoggingService(logEntry);
    } else {
      console.log(JSON.stringify(logEntry, null, 2));
    }
  }

  private sanitizeContext(
    context?: Record<string, any>
  ): Record<string, any> | undefined {
    if (!context) return undefined;

    const sanitized = { ...context };

    // Remove sensitive data
    const sensitiveKeys = [
      "password",
      "secret",
      "token",
      "key",
      "authorization",
      "clientId",
      "clientSecret",
    ];
    sensitiveKeys.forEach((key) => {
      if (sanitized[key]) {
        sanitized[key] = "[REDACTED]";
      }
    });

    return sanitized;
  }

  private formatError(error: Error): ErrorDetails {
    return {
      type: error.constructor.name,
      message: error.message,
      stack: error.stack,
    };
  }

  private async sendToLoggingService(logEntry: LogEntry): Promise<void> {
    // Implementation for external logging service
    // Could be CloudWatch, DataDog, etc.
    // For now, just log to console in production
    console.log(JSON.stringify(logEntry));
  }
}
