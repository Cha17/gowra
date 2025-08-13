import { getSql } from './connection';
import { log } from '../lib/logger';

// ===== PHASE 3, STEP 3.2: DATABASE OPTIMIZATION AND INDEXES =====

// Database optimization configuration
interface OptimizationConfig {
  enableIndexes: boolean;
  enablePartitioning: boolean;
  enableCompression: boolean;
  maintenanceWindow: string; // Cron-like schedule
  vacuumThreshold: number; // Percentage of dead tuples
  analyzeThreshold: number; // Percentage of table changes
}

// Index definition interface
interface IndexDefinition {
  name: string;
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist' | 'spgist' | 'brin';
  unique?: boolean;
  partial?: string; // Partial index condition
}

// Performance optimization class
class DatabaseOptimizer {
  private config: OptimizationConfig;

  constructor() {
    this.config = {
      enableIndexes: true,
      enablePartitioning: false, // Not implemented yet
      enableCompression: false, // Not implemented yet
      maintenanceWindow: '0 2 * * *', // Daily at 2 AM
      vacuumThreshold: 20, // 20% dead tuples
      analyzeThreshold: 10 // 10% table changes
    };
  }

  // Create performance indexes
  async createPerformanceIndexes(): Promise<void> {
    if (!this.config.enableIndexes) {
      log.info('Database indexes disabled in configuration');
      return;
    }

    const indexes: IndexDefinition[] = [
      // Users table indexes
      {
        name: 'idx_users_email',
        table: 'users',
        columns: ['email'],
        type: 'btree',
        unique: true
      },
      {
        name: 'idx_users_created_at',
        table: 'users',
        columns: ['created_at'],
        type: 'btree'
      },

      // Admin users table indexes
      {
        name: 'idx_admin_users_email',
        table: 'admin_users',
        columns: ['email'],
        type: 'btree',
        unique: true
      },

      // Events table indexes
      {
        name: 'idx_events_date',
        table: 'events',
        columns: ['date'],
        type: 'btree'
      },
      {
        name: 'idx_events_status',
        table: 'events',
        columns: ['status'],
        type: 'btree'
      },
      {
        name: 'idx_events_organizer',
        table: 'events',
        columns: ['organizer'],
        type: 'btree'
      },
      {
        name: 'idx_events_venue',
        table: 'events',
        columns: ['venue'],
        type: 'btree'
      },
      {
        name: 'idx_events_price',
        table: 'events',
        columns: ['price'],
        type: 'btree'
      },
      {
        name: 'idx_events_registration_deadline',
        table: 'events',
        columns: ['registration_deadline'],
        type: 'btree'
      },

      // Registrations table indexes
      {
        name: 'idx_registrations_user_id',
        table: 'registrations',
        columns: ['user_id'],
        type: 'btree'
      },
      {
        name: 'idx_registrations_event_id',
        table: 'registrations',
        columns: ['event_id'],
        type: 'btree'
      },
      {
        name: 'idx_registrations_payment_status',
        table: 'registrations',
        columns: ['payment_status'],
        type: 'btree'
      },
      {
        name: 'idx_registrations_registration_date',
        table: 'registrations',
        columns: ['registration_date'],
        type: 'btree'
      },
      {
        name: 'idx_registrations_user_event',
        table: 'registrations',
        columns: ['user_id', 'event_id'],
        type: 'btree',
        unique: true
      },

      // Payment history table indexes
      {
        name: 'idx_payment_history_registration_id',
        table: 'payment_history',
        columns: ['registration_id'],
        type: 'btree'
      },
      {
        name: 'idx_payment_history_payment_reference',
        table: 'payment_history',
        columns: ['payment_reference'],
        type: 'btree'
      },
      {
        name: 'idx_payment_history_status',
        table: 'payment_history',
        columns: ['status'],
        type: 'btree'
      },
      {
        name: 'idx_payment_history_transaction_date',
        table: 'payment_history',
        columns: ['transaction_date'],
        type: 'btree'
      }
    ];

    log.info('Creating database performance indexes...', { 
      totalIndexes: indexes.length 
    });

    for (const index of indexes) {
      try {
        await this.createIndex(index);
        log.debug(`Index created successfully: ${index.name}`);
      } catch (error) {
        log.error(`Failed to create index: ${index.name}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          table: index.table,
          columns: index.columns
        });
      }
    }

    log.info('Database index creation completed');
  }

  // Create individual index
  private async createIndex(indexDef: IndexDefinition): Promise<void> {
    const uniqueClause = indexDef.unique ? 'UNIQUE' : '';
    const partialClause = indexDef.partial ? `WHERE ${indexDef.partial}` : '';
    
    const sqlQuery = `
      CREATE ${uniqueClause} INDEX IF NOT EXISTS ${indexDef.name}
      ON ${indexDef.table}
      USING ${indexDef.type} (${indexDef.columns.join(', ')})
      ${partialClause}
    `;

    const sql = await getSql();
    await sql.unsafe(sqlQuery);
  }

  // Analyze table statistics
  async analyzeTables(): Promise<void> {
    const tables = ['users', 'admin_users', 'events', 'registrations', 'payment_history'];
    
    log.info('Analyzing table statistics...', { tables });

    for (const table of tables) {
      try {
        const sql = await getSql();
        await sql.unsafe(`ANALYZE ${table}`);
        log.debug(`Table analyzed: ${table}`);
      } catch (error) {
        log.error(`Failed to analyze table: ${table}`, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    log.info('Table analysis completed');
  }

  // Vacuum tables to reclaim space
  async vacuumTables(): Promise<void> {
    const tables = ['users', 'admin_users', 'events', 'registrations', 'payment_history'];
    
    log.info('Vacuuming tables...', { tables });

    for (const table of tables) {
      try {
        const sql = await getSql();
        await sql.unsafe(`VACUUM ${table}`);
        log.debug(`Table vacuumed: ${table}`);
      } catch (error) {
        log.error(`Failed to vacuum table: ${table}`, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    log.info('Table vacuuming completed');
  }

  // Get table statistics
  async getTableStats(): Promise<Record<string, any>> {
    try {
      const sql = await getSql();
      const result = await sql.unsafe(`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation,
          most_common_vals,
          most_common_freqs,
          histogram_bounds
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname
      `);

      // Handle the result properly
      const stats = Array.isArray(result) ? result : result?.rows || result || [];
      return { stats };
    } catch (error) {
      log.error('Failed to get table statistics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { error: 'Failed to retrieve statistics' };
    }
  }

  // Get index usage statistics
  async getIndexStats(): Promise<Record<string, any>> {
    try {
      const sql = await getSql();
      const result = await sql.unsafe(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        ORDER BY idx_scan DESC
      `);

      // Handle the result properly
      const stats = Array.isArray(result) ? result : result?.rows || result || [];
      return { stats };
    } catch (error) {
      log.error('Failed to get index statistics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { error: 'Failed to retrieve index statistics' };
    }
  }

  // Check for unused indexes
  async findUnusedIndexes(): Promise<string[]> {
    try {
      const sql = await getSql();
      const result = await sql.unsafe(`
        SELECT 
          schemaname,
          tablename,
          indexname
        FROM pg_stat_user_indexes 
        WHERE idx_scan = 0 
        AND schemaname = 'public'
        ORDER BY tablename, indexname
      `);

      // Handle the result properly - it might be wrapped in an object
      const rows = Array.isArray(result) ? result : result?.rows || result || [];
      
      const unusedIndexes = rows.map((row: any) => `${row.tablename}.${row.indexname}`);
      
      if (unusedIndexes.length > 0) {
        log.warn('Unused indexes found', { 
          count: unusedIndexes.length,
          indexes: unusedIndexes 
        });
      }

      return unusedIndexes;
    } catch (error) {
      log.error('Failed to check for unused indexes', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  // Optimize table storage
  async optimizeTableStorage(): Promise<void> {
    log.info('Optimizing table storage...');

    try {
      // Reindex all tables
      const sql = await getSql();
      await sql.unsafe('REINDEX DATABASE current_database()');
      log.info('Database reindexing completed');

      // Update table statistics
      await this.analyzeTables();

      // Vacuum tables
      await this.vacuumTables();

      log.info('Table storage optimization completed');
    } catch (error) {
      log.error('Failed to optimize table storage', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get database performance metrics
  async getPerformanceMetrics(): Promise<Record<string, any>> {
    try {
      const sql = await getSql();
      const result = await sql.unsafe(`
        SELECT 
          datname,
          numbackends,
          xact_commit,
          xact_rollback,
          blks_read,
          blks_hit,
          tup_returned,
          tup_fetched,
          tup_inserted,
          tup_updated,
          tup_deleted
        FROM pg_stat_database 
        WHERE datname = current_database()
      `);

      // Handle the result properly
      const metrics = Array.isArray(result) ? result : result?.rows || result || [];

      const tableStats = await this.getTableStats();
      const indexStats = await this.getIndexStats();
      const unusedIndexes = await this.findUnusedIndexes();

      return {
        database: metrics[0] || {},
        tables: tableStats,
        indexes: indexStats,
        unusedIndexes,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      log.error('Failed to get performance metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { error: 'Failed to retrieve performance metrics' };
    }
  }

  // Update optimization configuration
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    log.info('Database optimization configuration updated', { config: this.config });
  }

  // Get current configuration
  getConfig(): OptimizationConfig {
    return { ...this.config };
  }
}

// Create and export singleton instance
export const databaseOptimizer = new DatabaseOptimizer();

// Export types for external use
export type { OptimizationConfig, IndexDefinition };

// Export convenience functions
export const dbOptimization = {
  createIndexes: () => databaseOptimizer.createPerformanceIndexes(),
  analyzeTables: () => databaseOptimizer.analyzeTables(),
  vacuumTables: () => databaseOptimizer.vacuumTables(),
  getStats: () => databaseOptimizer.getTableStats(),
  getIndexStats: () => databaseOptimizer.getIndexStats(),
  findUnusedIndexes: () => databaseOptimizer.findUnusedIndexes(),
  optimizeStorage: () => databaseOptimizer.optimizeTableStorage(),
  getPerformanceMetrics: () => databaseOptimizer.getPerformanceMetrics(),
  updateConfig: (config: Partial<OptimizationConfig>) => databaseOptimizer.updateConfig(config),
  getConfig: () => databaseOptimizer.getConfig()
};
