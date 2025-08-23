const STAGING_API = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';

async function debugAnalyticsSimple() {
  console.log('🔍 Debugging Analytics Endpoint - Simple Test');
  
  try {
    // Create a test user
    console.log('\n1️⃣ Creating test user...');
    const createResponse = await fetch(`${STAGING_API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `analytics-debug-${Date.now()}@example.com`,
        name: `Analytics Debug User ${Date.now()}`,
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
    
    // Upgrade to organizer
    console.log('\n3️⃣ Upgrading to organizer...');
    const upgradeResponse = await fetch(`${STAGING_API}/api/auth/upgrade-to-organizer`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        organization_name: 'Analytics Test Org',
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
    
    // Test my-events endpoint first
    console.log('\n4️⃣ Testing my-events endpoint...');
    const myEventsResponse = await fetch(`${STAGING_API}/api/events/my-events`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${newToken}`
      }
    });
    
    console.log('📊 My Events Status:', myEventsResponse.status);
    
    if (myEventsResponse.ok) {
      const myEventsData = await myEventsResponse.json();
      console.log('✅ My Events Response:', JSON.stringify(myEventsData, null, 2));
    } else {
      const errorData = await myEventsResponse.text();
      console.log('❌ My Events Error:', errorData);
    }
    
    // Now test analytics
    console.log('\n5️⃣ Testing analytics endpoint...');
    const analyticsResponse = await fetch(`${STAGING_API}/api/events/dashboard-analytics`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${newToken}`
      }
    });
    
    console.log('📊 Analytics Status:', analyticsResponse.status);
    
    if (analyticsResponse.ok) {
      const analyticsData = await analyticsResponse.json();
      console.log('✅ Analytics Response:', JSON.stringify(analyticsData, null, 2));
    } else {
      const errorData = await analyticsResponse.text();
      console.log('❌ Analytics Error:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugAnalyticsSimple();

