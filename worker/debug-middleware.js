const STAGING_API = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';

async function debugMiddleware() {
  console.log('🔍 Debugging Middleware Issue');
  
  try {
    // Create a test user
    console.log('\n1️⃣ Creating test user...');
    const createResponse = await fetch(`${STAGING_API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `middleware-debug-${Date.now()}@example.com`,
        name: `Middleware Debug User ${Date.now()}`,
        password: 'testpass123'
      })
    });
    
    const createData = await createResponse.json();
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
    const token = loginData.token;
    
    // Upgrade to organizer
    console.log('\n3️⃣ Upgrading to organizer...');
    const upgradeResponse = await fetch(`${STAGING_API}/api/auth/upgrade-to-organizer`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        organization_name: 'Middleware Debug Org',
        organization_type: 'Test',
        event_types: ['Test'],
        organization_description: 'Test',
        organization_website: 'https://example.com'
      })
    });
    
    const upgradeData = await upgradeResponse.json();
    if (!upgradeData.success) {
      console.log('❌ Failed to upgrade:', upgradeData);
      return;
    }
    
    const newToken = upgradeData.newToken;
    console.log('✅ Upgrade successful, new token received');
    
    // Test the new token with /me endpoint to confirm role
    console.log('\n4️⃣ Confirming role with /me endpoint...');
    const meResponse = await fetch(`${STAGING_API}/api/auth/me`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${newToken}`
      }
    });
    
    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✅ /me Response:', JSON.stringify(meData, null, 2));
      
      // Now try to access an organizer-only endpoint
      console.log('\n5️⃣ Testing organizer endpoint access...');
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
        const errorData = await organizerResponse.text();
        console.log('❌ Organizer endpoint error:', errorData);
      }
    } else {
      const errorData = await meResponse.text();
      console.log('❌ /me Error:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugMiddleware();
