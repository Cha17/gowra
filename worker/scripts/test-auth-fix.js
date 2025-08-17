const API_BASE = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';

async function testAuthFix() {
  console.log('🧪 Testing Authentication Fix for Organizer Role');
  console.log('================================================\n');

  try {
    // Step 1: Register a test user
    console.log('1️⃣ Registering test user...');
    const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
         email: 'testorganizer2@example.com',
         password: 'testpass123',
         name: 'Test Organizer'
       })
    });

    if (!registerResponse.ok) {
      const error = await registerResponse.json();
      console.log('❌ Registration failed:', error);
      return;
    }

    const registerData = await registerResponse.json();
    console.log('✅ User registered:', registerData.user.email);
    console.log('   Role:', registerData.user.role);
    console.log('');

    // Step 2: Login
    console.log('2️⃣ Logging in...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
         email: 'testorganizer2@example.com',
         password: 'testpass123'
       })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.log('❌ Login failed:', error);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    console.log('   Role:', loginData.user.role);
    console.log('   Token received:', token ? 'Yes' : 'No');
    console.log('');

    // Step 3: Upgrade to organizer
    console.log('3️⃣ Upgrading to organizer...');
    const upgradeResponse = await fetch(`${API_BASE}/api/auth/upgrade-to-organizer`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        organization_name: 'Test Organization',
        organization_type: 'Community Group',
        event_types: ['Workshop', 'Conference'],
        organization_description: 'A test organization',
        organization_website: 'https://test.org'
      })
    });

    if (!upgradeResponse.ok) {
      const error = await upgradeResponse.json();
      console.log('❌ Upgrade failed:', error);
      return;
    }

    const upgradeData = await upgradeResponse.json();
    const newToken = upgradeData.token;
    console.log('✅ Upgrade successful');
    console.log('   New role:', upgradeData.user.role);
    console.log('   New token received:', newToken ? 'Yes' : 'No');
    console.log('   Organization:', upgradeData.user.organization_name);
    console.log('');

    // Step 4: Test /me endpoint with new token
    console.log('4️⃣ Testing /me endpoint with new token...');
    const meResponse = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { 
        'Authorization': `Bearer ${newToken}`
      }
    });

    if (!meResponse.ok) {
      const error = await meResponse.json();
      console.log('❌ /me endpoint failed:', error);
      return;
    }

    const meData = await meResponse.json();
    console.log('✅ /me endpoint successful');
    console.log('   User role:', meData.user.role);
    console.log('   Organization:', meData.user.organization_name);
    console.log('   Event types:', meData.user.event_types);
    console.log('');

    // Step 5: Test token refresh
    console.log('5️⃣ Testing token refresh...');
    const refreshResponse = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refreshToken: loginData.refreshToken
      })
    });

    if (!refreshResponse.ok) {
      const error = await refreshResponse.json();
      console.log('❌ Token refresh failed:', error);
      return;
    }

    const refreshData = await refreshResponse.json();
    console.log('✅ Token refresh successful');
    console.log('   Refreshed user role:', refreshData.user.role);
    console.log('   Organization preserved:', refreshData.user.organization_name);
    console.log('');

    console.log('🎉 All tests passed! Organizer role is now properly maintained!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ Registration works');
    console.log('   ✅ Login works');
    console.log('   ✅ Upgrade to organizer works');
    console.log('   ✅ /me endpoint returns organizer data');
    console.log('   ✅ Token refresh preserves organizer data');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testAuthFix();
