const STAGING_API = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';

async function debugEmptyQuery() {
  console.log('🔍 Debugging Empty Query Issue');
  
  try {
    // Create a test user
    console.log('\n1️⃣ Creating test user...');
    const createResponse = await fetch(`${STAGING_API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `empty-query-${Date.now()}@example.com`,
        name: `Empty Query User ${Date.now()}`,
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
        organization_name: 'Empty Query Org',
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
    
    // Test my-events endpoint (should return empty array, not 500)
    console.log('\n4️⃣ Testing my-events endpoint (no events yet)...');
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
    
    // Test dashboard-analytics endpoint (should return 0s, not 500)
    console.log('\n5️⃣ Testing dashboard-analytics endpoint (no events yet)...');
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

debugEmptyQuery();

