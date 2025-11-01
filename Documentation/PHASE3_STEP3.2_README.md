# 🗄️ **Phase 3, Step 3.2: Database Connection and ORM Setup**

## 📋 **Overview**

This step implements comprehensive database connection management, query optimization, and performance monitoring for the Event Management System using Drizzle ORM with Neon PostgreSQL.

## ✅ **Completed Requirements**

### 1. **✅ Configure Drizzle ORM connection to Neon database**

- Enhanced connection with `DatabaseConnectionManager` class
- Connection pooling and retry logic
- Health monitoring and automatic reconnection
- Graceful shutdown handling

### 2. **✅ Set up database schema definitions using Drizzle**

- Complete schema with all tables: `users`, `admin_users`, `events`, `registrations`, `payment_history`
- Proper enums: `event_status`, `payment_status`
- Foreign key relationships and constraints
- TypeScript type exports

### 3. **✅ Create database migration scripts**

- Drizzle configuration in `drizzle.config.ts`
- Migration scripts: `0000_dry_bullseye.sql`, `0001_spicy_exodus.sql`, `0002_add_refresh_tokens.sql`
- Migration commands: `db:generate`, `db:migrate`, `db:studio`

### 4. **✅ Implement database connection pooling and error handling**

- Connection pooling with configurable limits
- Automatic retry with exponential backoff
- Comprehensive error handling and logging
- Connection health checks every 30 seconds
- Automatic reconnection on failures

### 5. **✅ Set up database query optimization**

- Query performance monitoring and metrics
- Query caching with TTL and size limits
- Slow query detection and logging
- Performance statistics collection
- Database optimization and maintenance tools

## 🏗️ **Architecture**

### **Database Connection Manager** (`src/db/connection.ts`)

```typescript
class DatabaseConnectionManager {
  // Connection pooling and health monitoring
  // Automatic retry and reconnection
  // Performance tracking and error handling
}
```

### **Query Optimizer** (`src/db/queryOptimizer.ts`)

```typescript
class QueryOptimizer {
  // Query caching and performance monitoring
  // Slow query detection
  // Query execution metrics
}
```

### **Database Optimizer** (`src/db/optimization.ts`)

```typescript
class DatabaseOptimizer {
  // Performance indexes creation
  // Table statistics and maintenance
  // Storage optimization
}
```

## 📁 **File Structure**

```
server/
├── src/db/
│   ├── connection.ts          # Enhanced database connection manager
│   ├── queryOptimizer.ts      # Query optimization and caching
│   ├── optimization.ts        # Database optimization and indexes
│   ├── schema.ts              # Drizzle schema definitions
│   └── index.ts               # Database exports and utilities
├── scripts/
│   └── initDatabase.ts        # Database initialization script
├── drizzle/
│   ├── *.sql                  # Migration scripts
│   ├── schema.ts              # Generated schema
│   └── relations.ts           # Table relations
└── drizzle.config.ts          # Drizzle configuration
```

## ⚙️ **Configuration**

### **Environment Variables**

```bash
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=development|production
```

### **Connection Pool Settings**

```typescript
const POOL_CONFIG = {
  maxConnections: 10,
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 10000, // 10 seconds
  maxUses: 7500, // Connection reuse limit
};
```

### **Query Cache Settings**

```typescript
const CACHE_CONFIG = {
  enabled: true,
  maxSize: 100, // Maximum cache entries
  ttl: 5 * 60 * 1000, // 5 minutes TTL
};
```

## 🚀 **Usage**

### **Basic Database Operations**

```typescript
import { db, optimizedQuery } from './db';

// Optimized SELECT with caching
const users = await optimizedQuery.select(
  () => db.select().from(users),
  'users',
  'all_users_cache',
  true
);

// Optimized INSERT
const newUser = await optimizedQuery.insert(
  () => db.insert(users).values(userData),
  'users'
);
```

### **Database Health Monitoring**

```typescript
import { dbManager } from './db';

// Get connection status
const status = dbManager.getConnectionState();
console.log('Connected:', status.isConnected);

// Execute query with monitoring
const result = await dbManager.executeQuery(async () => {
  return await db.select().from(users);
});
```

### **Database Maintenance**

```typescript
import { dbOptimization } from './db';

// Create performance indexes
await dbOptimization.createIndexes();

// Analyze table statistics
await dbOptimization.analyzeTables();

// Vacuum tables
await dbOptimization.vacuumTables();

// Get performance metrics
const metrics = await dbOptimization.getPerformanceMetrics();
```

## 🔧 **Available Scripts**

### **Package.json Scripts**

```bash
# Database initialization and optimization
bun run db:init              # Full database setup
bun run db:optimize          # Database optimization
bun run db:indexes           # Create performance indexes
bun run db:analyze           # Analyze table statistics
bun run db:vacuum            # Vacuum tables
bun run db:maintenance       # Run maintenance tasks

# Drizzle operations
bun run db:generate          # Generate migrations
bun run db:migrate           # Run migrations
bun run db:studio            # Open Drizzle Studio
```

### **Database Initialization Script**

```bash
bun run src/scripts/initDatabase.ts
```

## 📊 **Performance Indexes**

### **Users Table**

- `idx_users_email` (unique) - Email lookups
- `idx_users_created_at` - Date-based queries

### **Events Table**

- `idx_events_date` - Event date queries
- `idx_events_status` - Status filtering
- `idx_events_organizer` - Organizer searches
- `idx_events_venue` - Venue searches
- `idx_events_price` - Price-based queries
- `idx_events_registration_deadline` - Deadline queries

### **Registrations Table**

- `idx_registrations_user_id` - User registrations
- `idx_registrations_event_id` - Event registrations
- `idx_registrations_payment_status` - Payment status filtering
- `idx_registrations_registration_date` - Date-based queries
- `idx_registrations_user_event` (unique) - User-event pairs

### **Payment History Table**

- `idx_payment_history_registration_id` - Registration lookups
- `idx_payment_history_payment_reference` - Payment reference searches
- `idx_payment_history_status` - Payment status filtering
- `idx_payment_history_transaction_date` - Transaction date queries

## 📈 **Monitoring and Metrics**

### **API Endpoints**

```
GET  /api/db/health           # Database health check
GET  /api/db/metrics          # Performance metrics
POST /api/db/maintenance      # Maintenance actions
```

### **Health Check Response**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": {
    "connection": "connected",
    "lastHealthCheck": "2024-01-01T00:00:00.000Z",
    "connectionCount": 1,
    "errorCount": 0
  },
  "performance": { ... },
  "message": "Database health check completed successfully"
}
```

### **Performance Metrics Response**

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "queryOptimization": {
    "cache": { "size": 5, "maxSize": 100, "enabled": true },
    "metrics": { "total": 25, "slowQueries": 2, "slowQueryThreshold": 1500 }
  },
  "databasePerformance": {
    "database": { ... },
    "tables": { ... },
    "indexes": { ... },
    "unusedIndexes": []
  }
}
```

## 🛠️ **Maintenance Actions**

### **Available Actions**

```json
{
  "action": "createIndexes"    // Create performance indexes
  "action": "analyzeTables"    // Update table statistics
  "action": "vacuumTables"     // Reclaim storage space
  "action": "optimizeStorage"  // Full storage optimization
}
```

### **Maintenance Request Example**

```bash
curl -X POST http://localhost:3000/api/db/maintenance \
  -H "Content-Type: application/json" \
  -d '{"action": "createIndexes"}'
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Connection Failures**

```typescript
// Check connection state
const state = dbManager.getConnectionState();
console.log('Connection:', state.isConnected);
console.log('Errors:', state.errorCount);
console.log('Last Error:', state.lastError);
```

#### **Slow Queries**

```typescript
// Get slow query metrics
const slowQueries = queryOptimizer.getSlowQueries(1000); // > 1 second
console.log('Slow queries:', slowQueries);
```

#### **Cache Performance**

```typescript
// Get cache statistics
const cacheStats = queryOptimizer.getPerformanceStats();
console.log('Cache hit rate:', cacheStats.cache);
```

### **Debug Mode**

```typescript
// Enable detailed logging
process.env.NODE_ENV = 'development';

// Check database logs
log.debug('Database operation details');
```

## 📚 **Dependencies**

### **Core Dependencies**

```json
{
  "drizzle-orm": "^0.44.4",
  "drizzle-kit": "^0.31.4",
  "@neondatabase/serverless": "^1.0.1"
}
```

### **Development Dependencies**

```json
{
  "@types/pg": "^8.15.5",
  "pg": "^8.16.3"
}
```

## 🎯 **Success Criteria**

- ✅ **Database Connection**: Stable connection with automatic recovery
- ✅ **Query Performance**: Optimized queries with caching and monitoring
- ✅ **Index Strategy**: Comprehensive performance indexes for all tables
- ✅ **Health Monitoring**: Real-time database health and performance metrics
- ✅ **Maintenance Tools**: Automated database maintenance and optimization
- ✅ **Error Handling**: Robust error handling with detailed logging
- ✅ **Scalability**: Connection pooling and query optimization for high load

## 🚀 **Next Steps**

With Step 3.2 completed, the database layer is now production-ready with:

- Robust connection management
- Comprehensive query optimization
- Performance monitoring and alerting
- Automated maintenance capabilities
- Production-grade error handling

The system is ready to proceed to the next phase of development with a solid, scalable database foundation.

## 📝 **Notes**

- All database operations are logged for debugging and monitoring
- Performance metrics are collected automatically
- Slow queries (>1 second) trigger warnings
- Connection failures trigger automatic retry with exponential backoff
- Database health is monitored every 30 seconds
- Graceful shutdown ensures proper connection cleanup
