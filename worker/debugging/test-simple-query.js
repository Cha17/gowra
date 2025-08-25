const STAGING_API = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';

async function testSimpleQuery() {
  console.log('🔍 Testing Simple Database Query');
  
  try {
    // Create a test user and upgrade to organizer
    console.log('\n1️⃣ Creating test user...');
    const createResponse = await fetch(`${STAGING_API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `query-test-${Date.now()}@example.com`,
        name: `Query Test User ${Date.now()}`,
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
        organization_name: 'Query Test Org',
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
    
    // Create a test event first
    console.log('\n4️⃣ Creating test event...');
    const createEventResponse = await fetch(`${STAGING_API}/api/events`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newToken}`
      },
      body: JSON.stringify({
        name: 'Query Test Event',
        details: 'Testing database queries',
        date: new Date(Date.now() + 86400000).toISOString(),
        imageUrl: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        price: 100,
        capacity: 50,
        registrationDeadline: new Date(Date.now() + 43200000).toISOString()
      })
    });
    
    const createEventData = await createEventResponse.json();
    console.log('✅ Event created:', createEventData.success);
    
    if (!createEventData.success) {
      console.log('❌ Failed to create event:', createEventData);
      return;
    }
    
    if (createEventData.success) {
      console.log('📊 Event data:', JSON.stringify(createEventData.data, null, 2));
      
      // Now test the my-events endpoint
      console.log('\n5️⃣ Testing my-events endpoint...');
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
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSimpleQuery();
