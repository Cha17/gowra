import { createDbClient } from './src/db/types.js';

// Add missing columns to users table
async function addMissingColumns() {
  try {
    const db = createDbClient({
      connection_string: 'postgresql://neondb_owner:npg_VoaHOG2Crd6g@ep-frosty-bar-a191vjzk.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    });

    console.log('🔧 Adding missing columns...\n');

    // Add missing columns one by one
    const columns = [
      'organization_type',
      'event_types', 
      'organization_description',
      'organization_website'
    ];

    for (const column of columns) {
      try {
        if (column === 'organization_type') {
          await db.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${column} VARCHAR(100)`);
        } else if (column === 'organization_website') {
          await db.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${column} VARCHAR(255)`);
        } else {
          await db.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${column} TEXT`);
        }
        console.log(`✅ Added column: ${column}`);
      } catch (error) {
        console.log(`⚠️  Column ${column} already exists or error:`, error.message);
      }
    }

    console.log('\n🎉 Done! Checking final schema...');
    
    // Check final schema
    const finalUser = await db
      .selectFrom('users')
      .selectAll()
      .limit(1)
      .execute();
    
    if (finalUser.length > 0) {
      console.log('Final users table columns:', Object.keys(finalUser[0]));
    }

  } catch (error) {
    console.error('Error adding columns:', error);
  }
}

addMissingColumns();
