import { createDbClient } from './src/db/types.js';

async function cleanupTestUser() {
  try {
    const db = createDbClient({
      connection_string: 'postgresql://neondb_owner:npg_VoaHOG2Crd6g@ep-frosty-bar-a191vjzk.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    });
    
    console.log('🧹 Cleaning up test user...');
    
    // Delete test user
    const result = await db
      .deleteFrom('users')
      .where('email', '=', 'test-organizer@example.com')
      .execute();
    
    console.log('✅ Test user cleaned up successfully');
    
  } catch (error) {
    console.error('❌ Error cleaning up test user:', error.message);
  }
}

cleanupTestUser();
