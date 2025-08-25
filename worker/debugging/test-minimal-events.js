const STAGING_API = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';

async function testMinimalEvents() {
  console.log('🔍 Testing Minimal Events Endpoints');
  
  try {
    // Create a test user
    console.log('\n1️⃣ Creating test user...');
    const createResponse = await fetch(`${STAGING_API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `minimal-test-${Date.now()}@example.com`,
        name: `Minimal Test User ${Date.now()}`,
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
    
    // Test auth endpoint
    console.log('\n3️⃣ Testing auth endpoint...');
    const authResponse = await fetch(`${STAGING_API}/api/events/test-auth`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 Auth Endpoint Status:', authResponse.status);
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Auth Endpoint Response:', JSON.stringify(authData, null, 2));
    } else {
      const errorData = await authResponse.text();
      console.log('❌ Auth Endpoint Error:', errorData);
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
        organization_name: 'Minimal Test Org',
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
    
    // Test organizer endpoint
    console.log('\n5️⃣ Testing organizer endpoint...');
    const organizerResponse = await fetch(`${STAGING_API}/api/events/test-organizer`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${newToken}`
      }
    });
    
    console.log('📊 Organizer Endpoint Status:', organizerResponse.status);
    if (organizerResponse.ok) {
      const organizerData = await organizerResponse.json();
      console.log('✅ Organizer Endpoint Response:', JSON.stringify(organizerData, null, 2));
    } else {
      const errorData = await organizerResponse.text();
      console.log('❌ Organizer Endpoint Error:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMinimalEvents();
