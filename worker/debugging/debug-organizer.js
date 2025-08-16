import { createDbClient } from '../src/db/types.js';

const STAGING_API = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';
const TEST_EMAIL = 'test-organizer@example.com';
const TEST_PASSWORD = 'testpassword123';

async function debugOrganizer() {
  console.log('🔍 Debugging Organizer Role Issue\n');
  
  // Step 1: Check if user exists and their role
  console.log('📋 Step 1: Check User in Database');
  try {
    const db = createDbClient({
      connection_string: 'postgresql://neondb_owner:npg_VoaHOG2Crd6g@ep-frosty-bar-a191vjzk.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    });
    
    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', TEST_EMAIL)
      .executeTakeFirst();
    
    if (user) {
      console.log('✅ User found in database:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Role:', user.role);
      console.log('   Organization:', user.organization_name);
      console.log('   All fields:', Object.keys(user));
    } else {
      console.log('❌ User not found in database');
      return;
    }
  } catch (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  // Step 2: Try to login and get token
  console.log('\n🔐 Step 2: Login and Get Token');
  try {
    const loginResponse = await fetch(`${STAGING_API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response status:', loginResponse.status);
    console.log('Login response data:', JSON.stringify(loginData, null, 2));
    
    if (loginData.success && loginData.token) {
      const token = loginData.token;
      console.log('✅ Token received, length:', token.length);
      
      // Step 3: Decode token to see what's in it
      console.log('\n🔍 Step 3: Decode JWT Token');
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          console.log('Token payload:', JSON.stringify(payload, null, 2));
        } catch (e) {
          console.log('Could not decode token payload');
        }
      }
      
      // Step 4: Try to create event with token
      console.log('\n🎉 Step 4: Try Event Creation');
      const eventResponse = await fetch(`${STAGING_API}/api/events`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'Debug Test Event',
          date: new Date(Date.now() + 86400000).toISOString(),
          venue: 'Debug Venue',
          details: 'Debug event details'
        })
      });
      
      const eventData = await eventResponse.json();
      console.log('Event creation response status:', eventResponse.status);
      console.log('Event creation response data:', JSON.stringify(eventData, null, 2));
      
    } else {
      console.log('❌ Login failed or no token received');
    }
    
  } catch (error) {
    console.log('❌ Error during login/event creation:', error.message);
  }
}

debugOrganizer().catch(console.error);
