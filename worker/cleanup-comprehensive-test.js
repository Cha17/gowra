import { createDbClient } from './src/db/types.js';

async function cleanupComprehensiveTest() {
  try {
    const db = createDbClient({
      connection_string: 'postgresql://neondb_owner:npg_VoaHOG2Crd6g@ep-frosty-bar-a191vjzk.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    });
    
    console.log('🧹 Cleaning up comprehensive test data...');
    
    // Delete test user (this will cascade delete any events)
    const result = await db
      .deleteFrom('users')
      .where('email', '=', 'comprehensive-test@example.com')
      .execute();
    
    console.log('✅ Comprehensive test data cleaned up successfully');
    
  } catch (error) {
    console.error('❌ Error cleaning up comprehensive test data:', error.message);
  }
}

cleanupComprehensiveTest();
