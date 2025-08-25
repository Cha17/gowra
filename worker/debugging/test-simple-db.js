const STAGING_API = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';

async function testSimpleDB() {
  console.log('🔍 Testing Simple Database Connection');
  
  try {
    // Test the public events endpoint first (this should work)
    console.log('\n1️⃣ Testing public events endpoint...');
    const publicEventsResponse = await fetch(`${STAGING_API}/api/events`);
    
    console.log('📊 Public Events Status:', publicEventsResponse.status);
    
    if (publicEventsResponse.ok) {
      const publicEventsData = await publicEventsResponse.json();
      console.log('✅ Public Events Response:', JSON.stringify(publicEventsData, null, 2));
    } else {
      const errorData = await publicEventsResponse.text();
      console.log('❌ Public Events Error:', errorData);
    }
    
    // Test the auth/me endpoint without auth (should fail but show different error)
    console.log('\n2️⃣ Testing /me endpoint without auth...');
    const meResponse = await fetch(`${STAGING_API}/api/auth/me`);
    
    console.log('📊 /me Status:', meResponse.status);
    
    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✅ /me Response:', JSON.stringify(meData, null, 2));
    } else {
      const errorData = await meResponse.text();
      console.log('❌ /me Error:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSimpleDB();
