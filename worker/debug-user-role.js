const STAGING_API = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';

async function debugUserRole() {
  console.log('🔍 Debugging User Role Issue');
  
  try {
    // Create a test user
    console.log('\n1️⃣ Creating test user...');
    const createResponse = await fetch(`${STAGING_API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `role-debug-${Date.now()}@example.com`,
        name: `Role Debug User ${Date.now()}`,
        password: 'testpass123'
      })
    });
    
    const createData = await createResponse.json();
    console.log('✅ User created:', createData.success);
    
    if (!createData.success) {
      console.log('❌ Failed to create user:', createData);
      return;
    }
    
    const userId = createData.user.id;
    console.log('🆔 User ID:', userId);
    
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
    console.log('🔑 Initial role:', loginData.user.role);
    
    const token = loginData.token;
    
    // Check /me endpoint to see current user data
    console.log('\n3️⃣ Checking /me endpoint...');
    const meResponse = await fetch(`${STAGING_API}/api/auth/me`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✅ /me Response:', JSON.stringify(meData, null, 2));
    } else {
      const errorData = await meResponse.text();
      console.log('❌ /me Error:', errorData);
    }
    
    // Upgrade to organizer
    console.log('\n4️⃣ Upgrading to organizer...');
    const upgradeResponse = await fetch(`${STAGING_API}/api/auth/upgrade-to-organizer`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        organization_name: 'Role Debug Org',
        organization_type: 'Test',
        event_types: ['Test'],
        organization_description: 'Test',
        organization_website: 'https://example.com'
      })
    });
    
    const upgradeData = await upgradeResponse.json();
    console.log('✅ Upgrade successful:', upgradeData.success);
    
    if (!upgradeData.success) {
      console.log('❌ Failed to upgrade:', upgradeData);
      return;
    }
    
    const newToken = upgradeData.newToken;
    console.log('🔑 New token received:', newToken ? 'Yes' : 'No');
    
    // Check /me endpoint with new token
    console.log('\n5️⃣ Checking /me endpoint with new token...');
    const meResponse2 = await fetch(`${STAGING_API}/api/auth/me`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${newToken}`
      }
    });
    
    if (meResponse2.ok) {
      const meData2 = await meResponse2.json();
      console.log('✅ /me Response with new token:', JSON.stringify(meData2, null, 2));
      
      // Check if the role is actually 'organizer'
      if (meData2.user.role === 'organizer') {
        console.log('✅ Role is correctly set to organizer');
      } else {
        console.log('❌ Role is NOT organizer:', meData2.user.role);
      }
    } else {
      const errorData2 = await meResponse2.text();
      console.log('❌ /me Error with new token:', errorData2);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugUserRole();
