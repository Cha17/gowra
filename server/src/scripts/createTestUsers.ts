import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

// Database connection
const sql = neon(process.env.DATABASE_URL!);

// Hash password utility
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// Create test users
export const createTestUsers = async () => {
  try {
    console.log('Creating test users...');

    // Test regular users
    const testUsers = [
      { email: 'user1@example.com', name: 'Test User 1', password: 'password123' },
      { email: 'user2@example.com', name: 'Test User 2', password: 'password123' },
      { email: 'john@example.com', name: 'John Doe', password: 'password123' },
      { email: 'jane@example.com', name: 'Jane Smith', password: 'password123' },
    ];

    for (const userData of testUsers) {
      try {
        const passwordHash = await hashPassword(userData.password);
        
        await sql`
          INSERT INTO users (email, name, password_hash)
          VALUES (${userData.email}, ${userData.name}, ${passwordHash})
          ON CONFLICT (email) DO NOTHING
        `;
        
        console.log(`✅ Created user: ${userData.email}`);
      } catch (error) {
        console.log(`⚠️  User ${userData.email} already exists or error:`, error);
      }
    }

    // Test admin user (if not exists)
    try {
      const adminPasswordHash = await hashPassword('admin123');
      
      await sql`
        INSERT INTO admin_users (email, name, password_hash)
        VALUES ('admin@gowra.com', 'Admin', ${adminPasswordHash})
        ON CONFLICT (email) DO NOTHING
      `;
      
      console.log('✅ Admin user created/verified: admin@gowra.com');
    } catch (error) {
      console.log('⚠️  Admin user already exists or error:', error);
    }

    console.log('✅ Test users creation completed!');
    
    // Show current users
    const users = await sql`SELECT email, name, created_at FROM users`;
    const admins = await sql`SELECT email, name, created_at FROM admin_users`;
    
    console.log(`\n📊 Current users: ${users.length}`);
    console.log(`📊 Current admins: ${admins.length}`);
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
  }
};

// Run if called directly
if (require.main === module) {
  createTestUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}
