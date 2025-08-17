const API_BASE = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';

async function cleanupTestOrganizer() {
  console.log('🧹 Cleaning up test organizer user...');
  
  try {
    // Login to get token
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testorganizer2@example.com',
        password: 'testpass123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed, user may already be deleted');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    console.log('✅ Logged in successfully');
    console.log('🗑️  User will be cleaned up when you run the database cleanup script');
    console.log('💡 You can manually delete this user from the database if needed');
    
  } catch (error) {
    console.log('ℹ️  User may already be cleaned up');
  }
}

cleanupTestOrganizer();
