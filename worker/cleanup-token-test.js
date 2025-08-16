import { createDbClient } from './src/db/types.js';

async function cleanupTokenTest() {
  try {
    const db = createDbClient({
      connection_string: 'postgresql://neondb_owner:npg_VoaHOG2Crd6g@ep-frosty-bar-a191vjzk.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    });
    
    console.log('🧹 Cleaning up token test data...');
    
    // Delete test user (this will cascade delete the event)
    const result = await db
      .deleteFrom('users')
      .where('email', '=', 'token-test@example.com')
      .execute();
    
    console.log('✅ Token test data cleaned up successfully');
    
  } catch (error) {
    console.error('❌ Error cleaning up token test data:', error.message);
  }
}

cleanupTokenTest();
