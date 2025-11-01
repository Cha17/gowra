const STAGING_API = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';
const TEST_EMAIL = 'comprehensive-test@example.com';
const TEST_PASSWORD = 'testpassword123';

// Test results tracking
const testResults = {
  day1: { passed: 0, failed: 0, tests: [] },
  day2: { passed: 0, failed: 0, tests: [] }
};

function logTest(day, name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${day.toUpperCase()}] ${name}`);
  if (details) console.log(`   ${details}`);
  
  testResults[day].tests.push({ name, passed, details });
  if (passed) testResults[day].passed++;
  else testResults[day].failed++;
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

async function runComprehensiveTest() {
  console.log('🧪 COMPREHENSIVE TEST: Day 1 + Day 2 Functionality\n');
  console.log('=' .repeat(70));
  
  let authToken = null;
  let userId = null;
  
  // ===== DAY 1 TESTS =====
  console.log('\n📅 DAY 1: Basic Authentication & User Management');
  console.log('=' .repeat(50));
  
  // Test 1.1: User Registration
  console.log('\n📝 Test 1.1: User Registration');
  const registerResult = await testAPI('/api/auth/register', 'POST', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    name: 'Comprehensive Test User'
  });
  
  if (registerResult.status === 200 && registerResult.data.success) {
    logTest('day1', 'User Registration', true, `User ID: ${registerResult.data.user.id}`);
    userId = registerResult.data.user.id;
  } else {
    logTest('day1', 'User Registration', false, `Status: ${registerResult.status}, Error: ${registerResult.data?.error}`);
    return;
  }
  
  // Test 1.2: User Login
  console.log('\n🔐 Test 1.2: User Login');
  const loginResult = await testAPI('/api/auth/login', 'POST', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  if (loginResult.status === 200 && loginResult.data.success && loginResult.data.token) {
    logTest('day1', 'User Login', true, 'Token received successfully');
    authToken = loginResult.data.token;
  } else {
    logTest('day1', 'User Login', false, `Status: ${loginResult.status}, Error: ${loginResult.data?.error}`);
    return;
  }
  
  // Test 1.3: Verify Token Contains User Info
  console.log('\n🔍 Test 1.3: Verify Token Payload');
  try {
    const tokenParts = authToken.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      if (payload.id && payload.email && payload.role) {
        logTest('day1', 'Token Payload Verification', true, `Role: ${payload.role}, Email: ${payload.email}`);
      } else {
        logTest('day1', 'Token Payload Verification', false, 'Missing required fields in token');
      }
    } else {
      logTest('day1', 'Token Payload Verification', false, 'Invalid token format');
    }
  } catch (error) {
    logTest('day1', 'Token Payload Verification', false, 'Could not decode token');
  }
  
  // Test 1.4: Check Database Debug Endpoint
  console.log('\n🗄️ Test 1.4: Database Debug Endpoint');
  const debugResult = await testAPI('/api/auth/debug/users');
  if (debugResult.status === 200 && debugResult.data.success) {
    logTest('day1', 'Database Debug Endpoint', true, 'Database accessible');
  } else {
    logTest('day1', 'Database Debug Endpoint', false, `Status: ${debugResult.status}`);
  }
  
  // ===== DAY 2 TESTS =====
  console.log('\n📅 DAY 2: Organizer Role & Event Management');
  console.log('=' .repeat(50));
  
  // Test 2.1: Try to Create Event (Should Fail - Not Organizer)
  console.log('\n🚫 Test 2.1: Create Event Without Organizer Role');
  const createEventFailResult = await testAPI('/api/events', 'POST', {
    name: 'Test Event',
    date: new Date(Date.now() + 86400000).toISOString(),
    venue: 'Test Venue',
    details: 'Test event details'
  }, authToken);
  
  if (createEventFailResult.status === 403 && createEventFailResult.data.needsUpgrade) {
    logTest('day2', 'Create Event Without Organizer Role', true, 'Correctly blocked with needsUpgrade flag');
  } else {
    logTest('day2', 'Create Event Without Organizer Role', false, `Expected 403, got ${createEventFailResult.status}`);
  }
  
  // Test 2.2: Upgrade to Organizer
  console.log('\n⬆️ Test 2.2: Upgrade to Organizer Role');
  const upgradeResult = await testAPI('/api/auth/upgrade-to-organizer', 'POST', {
    organization_name: 'Comprehensive Test Community',
    organization_type: 'Test Group',
    event_types: ['Workshop', 'Meetup'],
    organization_description: 'Testing comprehensive functionality',
    organization_website: 'https://test-community.com'
  }, authToken);
  
  if (upgradeResult.status === 200 && upgradeResult.data.success && upgradeResult.data.user.role === 'organizer') {
    logTest('day2', 'Upgrade to Organizer', true, `Role: ${upgradeResult.data.user.role}`);
  } else {
    logTest('day2', 'Upgrade to Organizer', false, `Status: ${upgradeResult.status}, Error: ${upgradeResult.data?.error}`);
    return;
  }
  
  // Test 2.3: Verify New Token Received
  console.log('\n🔄 Test 2.3: Verify New Token After Upgrade');
  if (upgradeResult.data.token && upgradeResult.data.token !== authToken) {
    logTest('day2', 'New Token After Upgrade', true, 'Token refreshed successfully');
    authToken = upgradeResult.data.token; // Update token
  } else {
    logTest('day2', 'New Token After Upgrade', false, 'No new token received or token unchanged');
    return;
  }
  
  // Test 2.4: Create Event as Organizer
  console.log('\n🎉 Test 2.4: Create Event as Organizer');
  const createEventResult = await testAPI('/api/events', 'POST', {
    name: 'Comprehensive Test Workshop',
    date: new Date(Date.now() + 86400000).toISOString(),
    venue: 'Test Venue',
    details: 'Testing event creation as organizer',
    price: 25.00,
    capacity: 50
  }, authToken);
  
  let eventId = null;
  if (createEventResult.status === 200 && createEventResult.data.success) {
    logTest('day2', 'Create Event as Organizer', true, `Event ID: ${createEventResult.data.event.id}`);
    eventId = createEventResult.data.event.id;
  } else {
    logTest('day2', 'Create Event as Organizer', false, `Status: ${createEventResult.status}, Error: ${createEventResult.data?.error}`);
    return;
  }
  
  // Test 2.5: Get Organizer Events
  console.log('\n📋 Test 2.5: Get Organizer Events');
  const getEventsResult = await testAPI('/api/events/my-events', 'GET', null, authToken);
  
  if (getEventsResult.status === 200 && getEventsResult.data.success && getEventsResult.data.events.length > 0) {
    logTest('day2', 'Get Organizer Events', true, `Found ${getEventsResult.data.events.length} events`);
  } else {
    logTest('day2', 'Get Organizer Events', false, `Status: ${getEventsResult.status}, Error: ${getEventsResult.data?.error}`);
  }
  
  // Test 2.6: Update Event
  console.log('\n✏️ Test 2.6: Update Event');
  const updateEventResult = await testAPI(`/api/events/${eventId}`, 'PUT', {
    name: 'Updated Comprehensive Test Workshop',
    date: new Date(Date.now() + 172800000).toISOString(),
    venue: 'Updated Test Venue',
    details: 'Updated workshop details',
    price: 30.00,
    capacity: 60
  }, authToken);
  
  if (updateEventResult.status === 200 && updateEventResult.data.success) {
    logTest('day2', 'Update Event', true, 'Event updated successfully');
  } else {
    logTest('day2', 'Update Event', false, `Status: ${updateEventResult.status}, Error: ${updateEventResult.data?.error}`);
  }
  
  // Test 2.7: Delete Event
  console.log('\n🗑️ Test 2.7: Delete Event');
  const deleteEventResult = await testAPI(`/api/events/${eventId}`, 'DELETE', null, authToken);
  
  if (deleteEventResult.status === 200 && deleteEventResult.data.success) {
    logTest('day2', 'Delete Event', true, 'Event deleted successfully');
  } else {
    logTest('day2', 'Delete Event', false, `Status: ${deleteEventResult.status}, Error: ${deleteEventResult.data?.error}`);
  }
  
  // Test 2.8: Verify Event Deletion
  console.log('\n🔍 Test 2.8: Verify Event Deletion');
  const verifyDeleteResult = await testAPI(`/api/events/${eventId}`, 'GET');
  
  if (verifyDeleteResult.status === 404) {
    logTest('day2', 'Verify Event Deletion', true, 'Event correctly returns 404');
  } else {
    logTest('day2', 'Verify Event Deletion', false, `Expected 404, got ${verifyDeleteResult.status}`);
  }
  
  // ===== FINAL VERIFICATION =====
  console.log('\n' + '=' .repeat(70));
  console.log('📊 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('=' .repeat(70));
  
  // Day 1 Summary
  console.log('\n📅 DAY 1 RESULTS:');
  console.log(`✅ Passed: ${testResults.day1.passed}`);
  console.log(`❌ Failed: ${testResults.day1.failed}`);
  console.log(`📈 Success Rate: ${((testResults.day1.passed / (testResults.day1.passed + testResults.day1.failed)) * 100).toFixed(1)}%`);
  
  // Day 2 Summary
  console.log('\n📅 DAY 2 RESULTS:');
  console.log(`✅ Passed: ${testResults.day2.passed}`);
  console.log(`❌ Failed: ${testResults.day2.failed}`);
  console.log(`📈 Success Rate: ${((testResults.day2.passed / (testResults.day2.passed + testResults.day2.failed)) * 100).toFixed(1)}%`);
  
  // Overall Summary
  const totalPassed = testResults.day1.passed + testResults.day2.passed;
  const totalTests = (testResults.day1.passed + testResults.day1.failed) + (testResults.day2.passed + testResults.day2.failed);
  
  console.log('\n🎯 OVERALL RESULTS:');
  console.log(`✅ Total Passed: ${totalPassed}`);
  console.log(`❌ Total Failed: ${totalTests - totalPassed}`);
  console.log(`📈 Overall Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
  
  if (totalPassed === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Both Day 1 and Day 2 are working perfectly!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the details above.');
  }
  
  // Clean up test data
  console.log('\n🧹 Cleaning up test data...');
  try {
    // Note: We can't clean up from here since this is a browser script
    // The cleanup will need to be done manually or via a separate script
    console.log('⚠️  Test data cleanup needed manually');
  } catch (error) {
    console.log('⚠️  Could not clean up test data:', error.message);
  }
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error);
