import { neon } from '@neondatabase/serverless';

// Database connection
const sql = neon(process.env.DATABASE_URL!);

// Force cleanup - removes all problematic data
export const forceCleanup = async () => {
  try {
    console.log('🧹 Force cleaning up database...');

    // Check current state
    const registrations = await sql`SELECT COUNT(*) as count FROM registrations`;
    const users = await sql`SELECT COUNT(*) as count FROM users`;
    const adminUsers = await sql`SELECT COUNT(*) as count FROM admin_users`;

    console.log(`📊 Current state:`);
    console.log(`   - Users: ${users[0]?.count || 0}`);
    console.log(`   - Admin Users: ${adminUsers[0]?.count || 0}`);
    console.log(`   - Registrations: ${registrations[0]?.count || 0}`);

    // Force delete all registrations (since they reference non-existent users anyway)
    console.log('\n🗑️  Force deleting all registrations...');
    
    try {
      const deleteResult = await sql`DELETE FROM registrations`;
      console.log(`✅ Deleted all registrations`);
    } catch (error) {
      console.log('⚠️  Could not delete registrations, trying to drop table...');
      try {
        await sql`DROP TABLE IF EXISTS registrations CASCADE`;
        console.log('✅ Dropped registrations table');
      } catch (dropError) {
        console.log('⚠️  Could not drop table:', dropError);
      }
    }

    // Check state after cleanup
    try {
      const registrationsAfter = await sql`SELECT COUNT(*) as count FROM registrations`;
      console.log(`📊 After cleanup:`);
      console.log(`   - Registrations: ${registrationsAfter[0]?.count || 0}`);
    } catch (error) {
      console.log('📊 After cleanup: Registrations table no longer exists');
    }

    console.log('\n✅ Database force cleanup completed!');
    console.log('💡 Now you can run: npx drizzle-kit push');
    
  } catch (error) {
    console.error('❌ Error during force cleanup:', error);
  }
};

// Run if called directly
if (require.main === module) {
  forceCleanup()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}
