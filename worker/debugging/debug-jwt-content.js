const STAGING_API = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';

// Simple JWT decoder (without verification)
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    return null;
  }
}

async function debugJWTContent() {
  console.log('🔍 Debugging JWT Token Content');
  
  try {
    // Create a test user
    console.log('\n1️⃣ Creating test user...');
    const createResponse = await fetch(`${STAGING_API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `jwt-content-${Date.now()}@example.com`,
        name: `JWT Content User ${Date.now()}`,
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
    
    console.log('🔑 Initial token decoded:');
    const initialDecoded = decodeJWT(token);
    if (initialDecoded) {
      console.log('📊 Initial Token Payload:', JSON.stringify(initialDecoded, null, 2));
    }
    
    // Upgrade to organizer
    console.log('\n3️⃣ Upgrading to organizer...');
    const upgradeResponse = await fetch(`${STAGING_API}/api/auth/upgrade-to-organizer`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        organization_name: 'JWT Content Org',
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
    
    console.log('🔑 New token decoded:');
    const newDecoded = decodeJWT(newToken);
    if (newDecoded) {
      console.log('📊 New Token Payload:', JSON.stringify(newDecoded, null, 2));
      
      // Check if role is correctly set
      if (newDecoded.role === 'organizer') {
        console.log('✅ Role is correctly set to organizer in JWT');
      } else {
        console.log('❌ Role is NOT organizer in JWT:', newDecoded.role);
      }
    }
    
    // Test the new token with /me endpoint
    console.log('\n4️⃣ Testing /me endpoint with new token...');
    const meResponse = await fetch(`${STAGING_API}/api/auth/me`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${newToken}`
      }
    });
    
    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✅ /me Response with new token:', JSON.stringify(meData, null, 2));
    } else {
      const errorData = await meResponse.text();
      console.log('❌ /me Error with new token:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugJWTContent();
