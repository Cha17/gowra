const STAGING_API = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';
const TEST_EMAIL = 'token-test@example.com';
const TEST_PASSWORD = 'testpassword123';

async function testTokenRefresh() {
  console.log('🧪 Testing Token Refresh After Upgrade\n');
  console.log('=' .repeat(60));
  
  // Step 1: Register test user
  console.log('📝 Step 1: Register Test User');
  const registerResponse = await fetch(`${STAGING_API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: 'Token Test User'
    })
  });
  
  if (registerResponse.status !== 200) {
    console.log('❌ Registration failed');
    return;
  }
  console.log('✅ User registered successfully');
  
  // Step 2: Login to get initial token
  console.log('\n🔐 Step 2: Login for Initial Token');
  const loginResponse = await fetch(`${STAGING_API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
  });
  
  const loginData = await loginResponse.json();
  if (!loginData.success || !loginData.token) {
    console.log('❌ Login failed');
    return;
  }
  
  const initialToken = loginData.token;
  console.log('✅ Initial token received');
  
  // Step 3: Decode initial token to see role
  console.log('\n🔍 Step 3: Check Initial Token Role');
  const initialTokenParts = initialToken.split('.');
  if (initialTokenParts.length === 3) {
    try {
      const initialPayload = JSON.parse(Buffer.from(initialTokenParts[1], 'base64').toString());
      console.log('Initial token role:', initialPayload.role);
      console.log('Initial token payload:', JSON.stringify(initialPayload, null, 2));
    } catch (e) {
      console.log('Could not decode initial token');
    }
  }
  
  // Step 4: Upgrade to organizer
  console.log('\n⬆️ Step 4: Upgrade to Organizer');
  const upgradeResponse = await fetch(`${STAGING_API}/api/auth/upgrade-to-organizer`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${initialToken}`
    },
    body: JSON.stringify({
      organization_name: 'Token Test Community',
      organization_type: 'Test Group',
      event_types: ['Workshop'],
      organization_description: 'Testing token refresh',
      organization_website: 'https://test.com'
    })
  });
  
  const upgradeData = await upgradeResponse.json();
  if (!upgradeData.success || !upgradeData.token) {
    console.log('❌ Upgrade failed:', upgradeData.error);
    return;
  }
  
  const newToken = upgradeData.token;
  console.log('✅ Upgrade successful, new token received');
  
  // Step 5: Decode new token to see updated role
  console.log('\n🔍 Step 5: Check New Token Role');
  const newTokenParts = newToken.split('.');
  if (newTokenParts.length === 3) {
    try {
      const newPayload = JSON.parse(Buffer.from(newTokenParts[1], 'base64').toString());
      console.log('New token role:', newPayload.role);
      console.log('New token payload:', JSON.stringify(newPayload, null, 2));
    } catch (e) {
      console.log('Could not decode new token');
    }
  }
  
  // Step 6: Test if new token works for organizer actions
  console.log('\n🎉 Step 6: Test New Token for Event Creation');
  const eventResponse = await fetch(`${STAGING_API}/api/events`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${newToken}`
    },
    body: JSON.stringify({
      name: 'Token Test Event',
      date: new Date(Date.now() + 86400000).toISOString(),
      venue: 'Test Venue',
      details: 'Testing with new token'
    })
  });
  
  const eventData = await eventResponse.json();
  if (eventResponse.status === 200 && eventData.success) {
    console.log('✅ Event creation successful with new token!');
    console.log('Event ID:', eventData.event.id);
  } else {
    console.log('❌ Event creation failed with new token:', eventData.error);
  }
  
  // Step 7: Verify tokens are different
  console.log('\n🔍 Step 7: Verify Tokens Are Different');
  if (initialToken !== newToken) {
    console.log('✅ Tokens are different (refresh working)');
    console.log('Initial token length:', initialToken.length);
    console.log('New token length:', newToken.length);
  } else {
    console.log('❌ Tokens are the same (refresh not working)');
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🎯 TOKEN REFRESH TEST COMPLETE');
  console.log('=' .repeat(60));
}

// Run the test
testTokenRefresh().catch(console.error);
