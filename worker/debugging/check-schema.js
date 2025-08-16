import { createDbClient } from '../src/db/types.js';

// Check database schema directly
async function checkSchema() {
  try {
    const db = createDbClient({
      connection_string: 'postgresql://neondb_owner:npg_VoaHOG2Crd6g@ep-frosty-bar-a191vjzk.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    });

    console.log('🔍 Checking database schema...\n');

    // Check users table columns
    console.log('📋 Users table columns:');
    const usersColumns = await db
      .selectFrom('users')
      .selectAll()
      .limit(1)
      .execute();
    
    if (usersColumns.length > 0) {
      const user = usersColumns[0];
      console.log('Available columns:', Object.keys(user));
    }

    // Check events table columns
    console.log('\n📋 Events table columns:');
    const eventsColumns = await db
      .selectFrom('events')
      .selectAll()
      .limit(1)
      .execute();
    
    if (eventsColumns.length > 0) {
      const event = eventsColumns[0];
      console.log('Available columns:', Object.keys(event));
    }

    // Check if specific columns exist
    console.log('\n🔍 Checking for specific columns:');
    
    try {
      const userWithRole = await db
        .selectFrom('users')
        .select(['id', 'email', 'role'])
        .limit(1)
        .execute();
      console.log('✅ role column exists in users table');
    } catch (error) {
      console.log('❌ role column does NOT exist in users table');
    }

    try {
      const eventWithOrganizerId = await db
        .selectFrom('events')
        .select(['id', 'name', 'organizer_id'])
        .limit(1)
        .execute();
      console.log('✅ organizer_id column exists in events table');
    } catch (error) {
      console.log('❌ organizer_id column does NOT exist in events table');
    }

  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema();
