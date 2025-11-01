const STAGING_API = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';

async function testDashboardAnalytics() {
  console.log('🧪 Testing Dashboard Analytics Endpoint');
  console.log('📍 Endpoint:', `${STAGING_API}/api/events/dashboard-analytics`);
  
  try {
    // First, let's create a test user and upgrade them to organizer
    console.log('\n1️⃣ Creating test user...');
    const createResponse = await fetch(`${STAGING_API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-organizer-${Date.now()}@example.com`,
        name: `Test Organizer ${Date.now()}`,
        password: 'testpass123'
      })
    });
    
    const createData = await createResponse.json();
    console.log('✅ User created:', createData.success);
    
    if (!createData.success) {
      console.log('❌ Failed to create user:', createData);
      return;
    }
    
    // Login to get token
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
    
    // Upgrade to organizer
    console.log('\n3️⃣ Upgrading to organizer...');
    const upgradeResponse = await fetch(`${STAGING_API}/api/auth/upgrade-to-organizer`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        organization_name: 'Test Organization',
        organization_type: 'Community Group',
        event_types: ['Workshop', 'Meetup'],
        organization_description: 'Test organization for testing',
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
    
    // Test dashboard analytics endpoint
    console.log('\n4️⃣ Testing dashboard analytics...');
    const analyticsResponse = await fetch(`${STAGING_API}/api/events/dashboard-analytics`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${newToken}`
      }
    });
    
    console.log('📊 Status:', analyticsResponse.status);
    
    if (analyticsResponse.ok) {
      const analyticsData = await analyticsResponse.json();
      console.log('✅ Analytics Response:', JSON.stringify(analyticsData, null, 2));
    } else {
      const errorData = await analyticsResponse.text();
      console.log('❌ Analytics Error:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDashboardAnalytics();

