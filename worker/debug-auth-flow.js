const STAGING_API = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';

async function debugAuthFlow() {
  console.log('🔍 Debugging Authentication Flow');
  
  try {
    // Create a test user
    console.log('\n1️⃣ Creating test user...');
    const createResponse = await fetch(`${STAGING_API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `auth-debug-${Date.now()}@example.com`,
        name: `Auth Debug User ${Date.now()}`,
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
    
    const token = loginData.token;
    console.log('🔑 Initial token role:', loginData.user.role);
    
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
        organization_name: 'Auth Test Org',
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
    } else {
      const errorData2 = await meResponse2.text();
      console.log('❌ /me Error with new token:', errorData2);
    }
    
    // Try to access organizer-only endpoint
    console.log('\n6️⃣ Testing organizer endpoint access...');
    const organizerResponse = await fetch(`${STAGING_API}/api/events/my-events`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${newToken}`
      }
    });
    
    console.log('📊 Organizer endpoint status:', organizerResponse.status);
    
    if (organizerResponse.ok) {
      const organizerData = await organizerResponse.json();
      console.log('✅ Organizer endpoint response:', JSON.stringify(organizerData, null, 2));
    } else {
      const errorData3 = await organizerResponse.text();
      console.log('❌ Organizer endpoint error:', errorData3);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugAuthFlow();
