import { neon } from '@neondatabase/serverless';

// Database connection
const sql = neon(process.env.DATABASE_URL!);

// Clean up orphaned registrations
export const cleanupDatabase = async () => {
  try {
    console.log('🧹 Cleaning up database...');

    // Check current state
    const registrations = await sql`SELECT COUNT(*) as count FROM registrations`;
    const users = await sql`SELECT COUNT(*) as count FROM users`;
    const adminUsers = await sql`SELECT COUNT(*) as count FROM admin_users`;

    console.log(`📊 Current state:`);
    console.log(`   - Users: ${users[0]?.count || 0}`);
    console.log(`   - Admin Users: ${adminUsers[0]?.count || 0}`);
    console.log(`   - Registrations: ${registrations[0]?.count || 0}`);

    // Clean up orphaned registrations
    console.log('\n🗑️  Cleaning up orphaned registrations...');
    
    const deleteResult = await sql`
      DELETE FROM registrations 
      WHERE user_id NOT IN (SELECT id FROM users)
    `;
    
    console.log(`✅ Deleted ${deleteResult.length || 0} orphaned registrations`);

    // Check state after cleanup
    const registrationsAfter = await sql`SELECT COUNT(*) as count FROM registrations`;
    console.log(`📊 After cleanup:`);
    console.log(`   - Registrations: ${registrationsAfter[0]?.count || 0}`);

    console.log('\n✅ Database cleanup completed!');
    console.log('💡 Now you can run: npx drizzle-kit push');
    
  } catch (error) {
    console.error('❌ Error cleaning up database:', error);
  }
};

// Run if called directly
if (require.main === module) {
  cleanupDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}
