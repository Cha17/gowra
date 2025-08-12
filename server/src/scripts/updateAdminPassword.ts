import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function updateAdminPassword() {
  try {
    console.log('🔄 Updating admin password...');
    
    // Check if admin user exists
    const adminUser = await sql`
      SELECT id, email, name FROM admin_users 
      WHERE email = 'admin@gowra.com'
    `;
    
    if (adminUser.length === 0) {
      console.log('❌ Admin user not found. Creating one...');
      
      const newPassword = 'thisisadmin'; // Change this to your desired password
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      
      await sql`
        INSERT INTO admin_users (email, name, password_hash)
        VALUES ('admin@gowra.com', 'Admin User', ${hashedPassword})
      `;
      
      console.log('✅ Admin user created with password:', newPassword);
    } else {
      console.log('👤 Admin user found:', adminUser[0].email);
      
      // Update password
      const newPassword = 'thisisadmin'; // Change this to your desired password
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      
      await sql`
        UPDATE admin_users 
        SET password_hash = ${hashedPassword}
        WHERE email = 'admin@gowra.com'
      `;
      
      console.log('✅ Admin password updated to:', newPassword);
    }
    
    // Verify the update
    const updatedUser = await sql`
      SELECT email, name FROM admin_users 
      WHERE email = 'admin@gowra.com'
    `;
    
    console.log('🔍 Updated admin user:', updatedUser[0]);
    
  } catch (error) {
    console.error('❌ Error updating admin password:', error);
  } finally {
    process.exit(0);
  }
}

updateAdminPassword();
