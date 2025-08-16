import { createDbClient } from './src/db/types.js';

const STAGING_API = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';
const TEST_EMAIL = 'test-organizer-2@example.com';
const TEST_PASSWORD = 'testpassword123';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}`);
  if (details) console.log(`   ${details}`);
  
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function testAPI(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${STAGING_API}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Day 2: Organizer Role & Event Management APIs\n');
  console.log('=' .repeat(60));
  
  let authToken = null;
  let userId = null;
  
  // Test 1: Register a new test user
  console.log('\n📝 Test 1: User Registration');
  const registerResult = await testAPI('/api/auth/register', 'POST', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    name: 'Test Organizer'
  });
  
  if (registerResult.status === 200 && registerResult.data.success) {
    logTest('User Registration', true, `User ID: ${registerResult.data.user.id}`);
    userId = registerResult.data.user.id;
  } else {
    logTest('User Registration', false, `Status: ${registerResult.status}, Error: ${registerResult.data?.error}`);
    return; // Can't continue without a user
  }
  
  // Test 2: Login with test user
  console.log('\n🔐 Test 2: User Login');
  const loginResult = await testAPI('/api/auth/login', 'POST', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  if (loginResult.status === 200 && loginResult.data.success && loginResult.data.token) {
    logTest('User Login', true, 'Token received successfully');
    authToken = loginResult.data.token;
  } else {
    logTest('User Login', false, `Status: ${loginResult.status}, Error: ${loginResult.data?.error}`);
    return; // Can't continue without authentication
  }
  
  // Test 3: Try to create event (should fail - not organizer yet)
  console.log('\n🚫 Test 3: Create Event Without Organizer Role');
  const createEventFailResult = await testAPI('/api/events', 'POST', {
    name: 'Test Event',
    date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    venue: 'Test Venue',
    details: 'Test event details'
  }, authToken);
  
  if (createEventFailResult.status === 403 && createEventFailResult.data.needsUpgrade) {
    logTest('Create Event Without Organizer Role', true, 'Correctly blocked with needsUpgrade flag');
  } else {
    logTest('Create Event Without Organizer Role', false, `Expected 403, got ${createEventFailResult.status}`);
  }
  
  // Test 4: Upgrade user to organizer
  console.log('\n⬆️ Test 4: Upgrade to Organizer Role');
  const upgradeResult = await testAPI('/api/auth/upgrade-to-organizer', 'POST', {
    organization_name: 'Test Community',
    organization_type: 'Community Group',
    event_types: ['Workshop', 'Meetup'],
    organization_description: 'A test community for testing purposes',
    organization_website: 'https://test-community.com'
  }, authToken);
  
  if (upgradeResult.status === 200 && upgradeResult.data.success && upgradeResult.data.user.role === 'organizer') {
    logTest('Upgrade to Organizer', true, `Role: ${upgradeResult.data.user.role}`);
  } else {
    logTest('Upgrade to Organizer', false, `Status: ${upgradeResult.status}, Error: ${upgradeResult.data?.error}`);
    return; // Can't continue without organizer role
  }
  
  // Test 4.5: Re-login to get fresh token with new role
  console.log('\n🔄 Test 4.5: Re-login for Fresh Token');
  const reloginResult = await testAPI('/api/auth/login', 'POST', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  if (reloginResult.status === 200 && reloginResult.data.success && reloginResult.data.token) {
    logTest('Re-login for Fresh Token', true, 'New token received with updated role');
    authToken = reloginResult.data.token; // Update token with new one
  } else {
    logTest('Re-login for Fresh Token', false, `Status: ${reloginResult.status}, Error: ${reloginResult.data?.error}`);
    return; // Can't continue without fresh token
  }
  
  // Test 5: Create event (should succeed now)
  console.log('\n🎉 Test 5: Create Event as Organizer');
  const createEventResult = await testAPI('/api/events', 'POST', {
    name: 'Test Workshop',
    date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    venue: 'Test Venue',
    details: 'A test workshop event',
    price: 25.00,
    capacity: 50
  }, authToken);
  
  let eventId = null;
  if (createEventResult.status === 200 && createEventResult.data.success) {
    logTest('Create Event as Organizer', true, `Event ID: ${createEventResult.data.event.id}`);
    eventId = createEventResult.data.event.id;
  } else {
    logTest('Create Event as Organizer', false, `Status: ${createEventResult.status}, Error: ${createEventResult.data?.error}`);
    return; // Can't continue without an event
  }
  
  // Test 6: Get organizer's events
  console.log('\n📋 Test 6: Get Organizer Events');
  const getEventsResult = await testAPI('/api/events/my-events', 'GET', null, authToken);
  
  if (getEventsResult.status === 200 && getEventsResult.data.success && getEventsResult.data.events.length > 0) {
    logTest('Get Organizer Events', true, `Found ${getEventsResult.data.events.length} events`);
  } else {
    logTest('Get Organizer Events', false, `Status: ${getEventsResult.status}, Error: ${getEventsResult.data?.error}`);
  }
  
  // Test 7: Update event
  console.log('\n✏️ Test 7: Update Event');
  const updateEventResult = await testAPI(`/api/events/${eventId}`, 'PUT', {
    name: 'Updated Test Workshop',
    date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    venue: 'Updated Test Venue',
    details: 'Updated workshop details',
    price: 30.00,
    capacity: 60
  }, authToken);
  
  if (updateEventResult.status === 200 && updateEventResult.data.success) {
    logTest('Update Event', true, 'Event updated successfully');
  } else {
    logTest('Update Event', false, `Status: ${updateEventResult.status}, Error: ${updateEventResult.data?.error}`);
  }
  
  // Test 8: Delete event
  console.log('\n🗑️ Test 8: Delete Event');
  const deleteEventResult = await testAPI(`/api/events/${eventId}`, 'DELETE', null, authToken);
  
  if (deleteEventResult.status === 200 && deleteEventResult.data.success) {
    logTest('Delete Event', true, 'Event deleted successfully');
  } else {
    logTest('Delete Event', false, `Status: ${deleteEventResult.status}, Error: ${deleteEventResult.data?.error}`);
  }
  
  // Test 9: Verify event is deleted
  console.log('\n🔍 Test 9: Verify Event Deletion');
  const verifyDeleteResult = await testAPI(`/api/events/${eventId}`, 'GET');
  
  if (verifyDeleteResult.status === 404) {
    logTest('Verify Event Deletion', true, 'Event correctly returns 404');
  } else {
    logTest('Verify Event Deletion', false, `Expected 404, got ${verifyDeleteResult.status}`);
  }
  
  // Test 10: Test authorization (try to access with different user)
  console.log('\n🚫 Test 10: Authorization - Different User');
  const differentUserResult = await testAPI('/api/events/my-events', 'GET', null, 'invalid-token');
  
  if (differentUserResult.status === 401) {
    logTest('Authorization - Different User', true, 'Correctly blocked with invalid token');
  } else {
    logTest('Authorization - Different User', false, `Expected 401, got ${differentUserResult.status}`);
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Day 2 implementation is working perfectly!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the details above.');
  }
  
  // Clean up test data
  console.log('\n🧹 Cleaning up test data...');
  try {
    const db = createDbClient({
      connection_string: 'postgresql://neondb_owner:npg_VoaHOG2Crd6g@ep-frosty-bar-a191vjzk.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    });
    
    // Delete test user
    await db.deleteFrom('users').where('email', '=', TEST_EMAIL).execute();
    console.log('✅ Test user cleaned up');
  } catch (error) {
    console.log('⚠️  Could not clean up test user:', error.message);
  }
}

// Run the tests
runTests().catch(console.error);
