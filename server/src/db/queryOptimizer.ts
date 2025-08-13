import { getDb, getSql } from './connection';
import { log } from '../lib/logger';

// ===== PHASE 3, STEP 3.2: DATABASE QUERY OPTIMIZATION =====

// Query performance metrics
interface QueryMetrics {
  queryId: string;
  sql: string;
  duration: number;
  timestamp: number;
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  rowCount?: number;
  error?: string;
}

// Query cache configuration
interface QueryCacheConfig {
  enabled: boolean;
  maxSize: number;
  ttl: number; // Time to live in milliseconds
}

// Query optimization strategies
interface OptimizationStrategy {
  useIndexes: boolean;
  limitResults: boolean;
  maxLimit: number;
  enableQueryCache: boolean;
}

// Query cache implementation
class QueryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private config: QueryCacheConfig;

  constructor(config: QueryCacheConfig) {
    this.config = config;
  }

  set(key: string, data: any, ttl: number = this.config.ttl): void {
    if (!this.config.enabled) return;

    // Clean up old entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    if (!this.config.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      enabled: this.config.enabled
    };
  }
}

// Query performance monitor
class QueryPerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private maxMetrics = 1000;
  private slowQueryThreshold = 1000; // 1 second

  recordQuery(metric: QueryMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the last maxMetrics entries
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow queries
    if (metric.duration > this.slowQueryThreshold) {
      log.warn('Slow database query detected', {
        queryId: metric.queryId,
        table: metric.table,
        operation: metric.operation,
        duration: `${metric.duration}ms`,
        threshold: `${this.slowQueryThreshold}ms`
      });
    }

    // Log query performance in development
    if (process.env.NODE_ENV === 'development') {
      log.debug('Database query executed', {
        queryId: metric.queryId,
        table: metric.table,
        operation: metric.operation,
        duration: `${metric.duration}ms`,
        rowCount: metric.rowCount
      });
    }
  }

  getMetrics(): QueryMetrics[] {
    return [...this.metrics];
  }

  getSlowQueries(threshold: number = this.slowQueryThreshold): QueryMetrics[] {
    return this.metrics.filter(m => m.duration > threshold);
  }

  getTablePerformance(table: string): { avgDuration: number; totalQueries: number; slowQueries: number } {
    const tableMetrics = this.metrics.filter(m => m.table === table);
    if (tableMetrics.length === 0) {
      return { avgDuration: 0, totalQueries: 0, slowQueries: 0 };
    }

    const totalDuration = tableMetrics.reduce((sum, m) => sum + m.duration, 0);
    const avgDuration = totalDuration / tableMetrics.length;
    const slowQueries = tableMetrics.filter(m => m.duration > this.slowQueryThreshold).length;

    return {
      avgDuration: Math.round(avgDuration),
      totalQueries: tableMetrics.length,
      slowQueries
    };
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

// Query optimizer
class QueryOptimizer {
  private cache: QueryCache;
  private monitor: QueryPerformanceMonitor;
  private strategy: OptimizationStrategy;

  constructor() {
    this.cache = new QueryCache({
      enabled: true,
      maxSize: 100,
      ttl: 5 * 60 * 1000 // 5 minutes
    });

    this.monitor = new QueryPerformanceMonitor();
    
    this.strategy = {
      useIndexes: true,
      limitResults: true,
      maxLimit: 1000,
      enableQueryCache: true
    };
  }

  // Generate cache key for query
  private generateCacheKey(sql: string, params: any[]): string {
    const paramString = JSON.stringify(params);
    return `${sql}_${paramString}`;
  }

  // Execute query with optimization
  async executeQuery<T>(
    queryFn: () => Promise<T>,
    options: {
      table: string;
      operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
      cacheKey?: string;
      enableCache?: boolean;
      maxLimit?: number;
    }
  ): Promise<T> {
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const startTime = Date.now();

    try {
      let result: T;

      // Check cache for SELECT operations
      if (options.operation === 'SELECT' && 
          options.enableCache !== false && 
          this.strategy.enableQueryCache &&
          options.cacheKey) {
        
        const cached = this.cache.get(options.cacheKey);
        if (cached) {
          log.debug('Query result served from cache', { cacheKey: options.cacheKey });
          return cached;
        }
      }

      // Execute the query
      result = await queryFn();

      // Cache the result for SELECT operations
      if (options.operation === 'SELECT' && 
          options.enableCache !== false && 
          this.strategy.enableQueryCache &&
          options.cacheKey) {
        
        this.cache.set(options.cacheKey, result);
      }

      const duration = Date.now() - startTime;
      const rowCount = Array.isArray(result) ? result.length : 1;

      // Record metrics
      this.monitor.recordQuery({
        queryId,
        sql: options.cacheKey || 'unknown',
        duration,
        timestamp: startTime,
        table: options.table,
        operation: options.operation,
        rowCount
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Record error metrics
      this.monitor.recordQuery({
        queryId,
        sql: options.cacheKey || 'unknown',
        duration,
        timestamp: startTime,
        table: options.table,
        operation: options.operation,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  // Optimized SELECT query with caching
  async select<T>(
    queryFn: () => Promise<T[]>,
    table: string,
    cacheKey?: string,
    enableCache: boolean = true
  ): Promise<T[]> {
    return this.executeQuery(queryFn, {
      table,
      operation: 'SELECT',
      cacheKey,
      enableCache
    });
  }

  // Optimized INSERT query
  async insert<T>(
    queryFn: () => Promise<T>,
    table: string
  ): Promise<T> {
    return this.executeQuery(queryFn, {
      table,
      operation: 'INSERT'
    });
  }

  // Optimized UPDATE query
  async update<T>(
    queryFn: () => Promise<T>,
    table: string
  ): Promise<T> {
    return this.executeQuery(queryFn, {
      table,
      operation: 'UPDATE'
    });
  }

  // Optimized DELETE query
  async delete<T>(
    queryFn: () => Promise<T>,
    table: string
  ): Promise<T> {
    return this.executeQuery(queryFn, {
      table,
      operation: 'DELETE'
    });
  }

  // Clear cache for specific table
  clearTableCache(table: string): void {
    // This is a simplified implementation
    // In a real scenario, you'd want more sophisticated cache invalidation
    this.cache.clear();
    log.info(`Cache cleared for table: ${table}`);
  }

  // Get performance statistics
  getPerformanceStats() {
    return {
      cache: this.cache.getStats(),
      metrics: {
        total: this.monitor.getMetrics().length,
        slowQueries: this.monitor.getSlowQueries().length,
        slowQueryThreshold: this.monitor.getSlowQueries()[0]?.duration || 0
      }
    };
  }

  // Get table-specific performance
  getTablePerformance(table: string) {
    return this.monitor.getTablePerformance(table);
  }

  // Update optimization strategy
  updateStrategy(newStrategy: Partial<OptimizationStrategy>): void {
    this.strategy = { ...this.strategy, ...newStrategy };
    log.info('Query optimization strategy updated', { strategy: this.strategy });
  }
}

// Create and export singleton instance
export const queryOptimizer = new QueryOptimizer();

// Export types for external use
export type { QueryMetrics, QueryCacheConfig, OptimizationStrategy };

// Export convenience functions
export const optimizedQuery = {
  select: <T>(queryFn: () => Promise<T[]>, table: string, cacheKey?: string, enableCache?: boolean) =>
    queryOptimizer.select(queryFn, table, cacheKey, enableCache),
  
  insert: <T>(queryFn: () => Promise<T>, table: string) =>
    queryOptimizer.insert(queryFn, table),
  
  update: <T>(queryFn: () => Promise<T>, table: string) =>
    queryOptimizer.update(queryFn, table),
  
  delete: <T>(queryFn: () => Promise<T>, table: string) =>
    queryOptimizer.delete(queryFn, table),
  
  execute: <T>(queryFn: () => Promise<T>, options: any) =>
    queryOptimizer.executeQuery(queryFn, options)
};
