const STAGING_API = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';

async function debugSchema() {
  console.log('🔍 Debugging Database Schema');
  
  try {
    // Create a test user
    console.log('\n1️⃣ Creating test user...');
    const createResponse = await fetch(`${STAGING_API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `schema-debug-${Date.now()}@example.com`,
        name: `Schema Debug User ${Date.now()}`,
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
        organization_name: 'Schema Test Org',
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
    
    // Create a test event to see what fields are actually saved
    console.log('\n4️⃣ Creating test event...');
    const createEventResponse = await fetch(`${STAGING_API}/api/events`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newToken}`
      },
      body: JSON.stringify({
        name: 'Schema Test Event',
        details: 'Testing schema fields',
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        imageUrl: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        price: 100,
        capacity: 50,
        registrationDeadline: new Date(Date.now() + 43200000).toISOString() // 12 hours from now
      })
    });
    
    const createEventData = await createEventResponse.json();
    console.log('✅ Event created:', createEventData.success);
    
    if (createEventData.success) {
      console.log('📊 Event data:', JSON.stringify(createEventData.data, null, 2));
    } else {
      console.log('❌ Failed to create event:', createEventData);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugSchema();
