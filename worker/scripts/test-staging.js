// Test script to verify staging environment
console.log('🧪 Testing Staging Environment');

const STAGING_URL = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';
const PRODUCTION_URL = 'https://gowwra-api-worker-production.charlcrtz17.workers.dev'; // You'll get this when you deploy production

async function testEndpoint(url, endpoint, description) {
  try {
    console.log(`\n📍 Testing ${description}: ${url}${endpoint}`);
    const response = await fetch(`${url}${endpoint}`);
    const data = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    return { success: true, data };
  } catch (error) {
    console.log(`❌ Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting staging tests...\n');
  
  // Test basic health
  await testEndpoint(STAGING_URL, '/api/events', 'Events endpoint');
  
  // Add more tests as needed
  console.log('\n✨ Staging tests complete!');
}

runTests().catch(console.error);
