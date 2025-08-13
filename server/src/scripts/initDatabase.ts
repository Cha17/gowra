#!/usr/bin/env bun

// ===== PHASE 3, STEP 3.2: DATABASE INITIALIZATION SCRIPT =====

import { log } from '../lib/logger';
import { dbManager, dbUtils, databaseOptimizer } from '../db';

async function initializeDatabase() {
  log.info('🚀 Starting database initialization...');
  
  try {
    // Wait for database connection
    log.info('⏳ Waiting for database connection...');
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const state = dbManager.getConnectionState();
      if (state.isConnected) {
        log.info('✅ Database connected successfully');
        break;
      }
      
      log.info(`⏳ Attempt ${attempts + 1}/${maxAttempts}: Waiting for connection...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Failed to establish database connection after maximum attempts');
    }

    // 1. Create performance indexes
    log.info('📊 Creating database performance indexes...');
    await dbUtils.createIndexes();
    
    // 2. Analyze table statistics
    log.info('📈 Analyzing table statistics...');
    await dbUtils.analyzeTables();
    
    // 3. Get initial performance metrics
    log.info('📊 Collecting initial performance metrics...');
    const metrics = await dbUtils.getPerformanceMetrics();
    
    // 4. Check for unused indexes
    log.info('🔍 Checking for unused indexes...');
    const unusedIndexes = await dbUtils.findUnusedIndexes();
    
    // 5. Display results
    log.info('✅ Database initialization completed successfully!');
    
    console.log('\n📊 Database Initialization Results:');
    console.log('=====================================');
    console.log(`✅ Connection Status: ${dbManager.getConnectionState().isConnected ? 'Connected' : 'Disconnected'}`);
    console.log(`✅ Indexes Created: Performance indexes have been created`);
    console.log(`✅ Tables Analyzed: Statistics have been updated`);
    console.log(`✅ Performance Metrics: Collected successfully`);
    
    if (unusedIndexes.length > 0) {
      console.log(`⚠️  Unused Indexes: ${unusedIndexes.length} found`);
      unusedIndexes.forEach(index => console.log(`   - ${index}`));
    } else {
      console.log(`✅ Unused Indexes: None found`);
    }
    
    console.log('\n🔧 Available Maintenance Commands:');
    console.log('==================================');
    console.log('POST /api/db/maintenance -action createIndexes');
    console.log('POST /api/db/maintenance -action analyzeTables');
    console.log('POST /api/db/maintenance -action vacuumTables');
    console.log('POST /api/db/maintenance -action optimizeStorage');
    
    console.log('\n📈 Performance Monitoring Endpoints:');
    console.log('=====================================');
    console.log('GET /api/db/health - Database health check');
    console.log('GET /api/db/metrics - Performance metrics');
    
    console.log('\n🚀 Database is ready for production use!');
    
  } catch (error) {
    log.error('❌ Database initialization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    console.error('\n❌ Database Initialization Failed!');
    console.error('====================================');
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    if (error instanceof Error && error.stack) {
      console.error('\nStack Trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run initialization if this script is executed directly
if (import.meta.main) {
  initializeDatabase()
    .then(() => {
      log.info('🎉 Database initialization script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      log.error('💥 Database initialization script failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      process.exit(1);
    });
}

export { initializeDatabase };
