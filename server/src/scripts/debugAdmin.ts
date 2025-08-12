import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function debugAdmin() {
  try {
    console.log('🔍 Debugging admin authentication...');
    
    // Check admin_users table
    console.log('\n📋 Checking admin_users table:');
    const adminUsers = await sql`
      SELECT id, email, name, password_hash, created_at FROM admin_users
    `;
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in admin_users table');
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Name: ${user.name}`);
        console.log(`     Password Hash: ${user.password_hash.substring(0, 20)}...`);
        console.log(`     Created: ${user.created_at}`);
      });
    }
    
    // Check users table
    console.log('\n📋 Checking users table:');
    const regularUsers = await sql`
      SELECT id, email, name, created_at FROM users
    `;
    
    if (regularUsers.length === 0) {
      console.log('❌ No regular users found in users table');
    } else {
      console.log(`✅ Found ${regularUsers.length} regular user(s):`);
      regularUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Name: ${user.name}`);
        console.log(`     Created: ${user.created_at}`);
      });
    }
    
    // Test password verification
    console.log('\n🔐 Testing password verification:');
    const testPassword = 'thisisadmin';
    
    if (adminUsers.length > 0) {
      const adminUser = adminUsers[0];
      const isValidPassword = bcrypt.compareSync(testPassword, adminUser.password_hash);
      console.log(`Testing password '${testPassword}' for admin user '${adminUser.email}':`);
      console.log(`  Password valid: ${isValidPassword ? '✅ YES' : '❌ NO'}`);
      
      if (!isValidPassword) {
        console.log('\n🔄 Generating new hash for testing:');
        const newHash = bcrypt.hashSync(testPassword, 10);
        console.log(`  New hash: ${newHash}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error debugging admin:', error);
  } finally {
    process.exit(0);
  }
}

debugAdmin();
