// ===== PHASE 3, STEP 3.2: DATABASE CONNECTION AND ORM SETUP =====

// Export database connection and manager
export { dbManager, getDb, getSql } from './connection';

// Export schema and types
export * from './schema';

// Export query optimization and performance monitoring
export { queryOptimizer, optimizedQuery } from './queryOptimizer';
export type { QueryMetrics, QueryCacheConfig, OptimizationStrategy } from './queryOptimizer';

// Export database optimization and indexes
export { databaseOptimizer, dbOptimization } from './optimization';
export type { OptimizationConfig, IndexDefinition } from './optimization';

// Import dependencies for use in dbUtils
import { dbManager } from './connection';
import { queryOptimizer } from './queryOptimizer';
import { databaseOptimizer } from './optimization';

// Export database utilities
export const dbUtils = {
  // Connection utilities
  getConnectionState: () => dbManager.getConnectionState(),
  executeQuery: <T>(queryFn: () => Promise<T>) => dbManager.executeQuery(queryFn),
  
  // Query optimization utilities
  getQueryStats: () => queryOptimizer.getPerformanceStats(),
  getTablePerformance: (table: string) => queryOptimizer.getTablePerformance(table),
  
  // Database optimization utilities
  getPerformanceMetrics: () => databaseOptimizer.getPerformanceMetrics(),
  getOptimizationConfig: () => databaseOptimizer.getConfig(),
  
  // Maintenance utilities
  createIndexes: () => databaseOptimizer.createPerformanceIndexes(),
  analyzeTables: () => databaseOptimizer.analyzeTables(),
  vacuumTables: () => databaseOptimizer.vacuumTables(),
  optimizeStorage: () => databaseOptimizer.optimizeTableStorage(),
  findUnusedIndexes: () => databaseOptimizer.findUnusedIndexes()
}; 