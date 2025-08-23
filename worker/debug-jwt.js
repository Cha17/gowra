const STAGING_API = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';

async function debugJWT() {
  console.log('🔍 Debugging JWT Issue');
  
  try {
    // Create a test user
    console.log('\n1️⃣ Creating test user...');
    const createResponse = await fetch(`${STAGING_API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `jwt-debug-${Date.now()}@example.com`,
        name: `JWT Debug User ${Date.now()}`,
        password: 'testpass123'
      })
    });
    
    const createData = await createResponse.json();
    console.log('✅ User created:', createData.success);
    
    if (!createData.success) {
      console.log('❌ Failed to create user:', createData);
      return;
    }
    
    // Login
    console.log('\n2️⃣ Logging in...');
    const loginResponse = await fetch(`${STAGING_API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: createData.user.email,
        password: 'testpass123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful:', loginData.success);
    
    if (!loginData.success) {
      console.log('❌ Failed to login:', loginData);
      return;
    }
    
    const token = loginData.token;
    console.log('🔑 Token received:', token ? 'Yes' : 'No');
    console.log('🔑 Token length:', token ? token.length : 0);
    
    // Test /me endpoint to see if token works
    console.log('\n3️⃣ Testing /me endpoint...');
    const meResponse = await fetch(`${STAGING_API}/api/auth/me`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 /me Status:', meResponse.status);
    
    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✅ /me Response:', JSON.stringify(meData, null, 2));
    } else {
      const errorData = await meResponse.text();
      console.log('❌ /me Error:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugJWT();

