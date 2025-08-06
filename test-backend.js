// Test backend connection
const testBackend = async () => {
  const backendUrl = 'https://lover-0ekx.onrender.com';
  
  console.log('🔍 Testing backend connection...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${backendUrl}/health`);
    console.log('   Status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ Health check passed:', healthData.status);
    } else {
      console.log('   ❌ Health check failed');
    }
    
    // Test CORS with AI companion endpoint
    console.log('\n2. Testing CORS with AI companion endpoint...');
    const corsResponse = await fetch(`${backendUrl}/api/ai-companion/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://lover-livid.vercel.app'
      },
      body: JSON.stringify({
        companionConfig: {
          name: "test",
          personality: "friendly",
          identity: "test companion",
          gender: "Female",
          role: "friend"
        }
      })
    });
    
    console.log('   Status:', corsResponse.status);
    console.log('   CORS Headers:', {
      'access-control-allow-origin': corsResponse.headers.get('access-control-allow-origin'),
      'access-control-allow-credentials': corsResponse.headers.get('access-control-allow-credentials')
    });
    
    if (corsResponse.ok) {
      console.log('   ✅ CORS test passed');
    } else {
      const errorText = await corsResponse.text();
      console.log('   ❌ CORS test failed:', errorText);
    }
    
  } catch (error) {
    console.log('   ❌ Connection error:', error.message);
  }
  
  console.log('\n✅ Backend test complete!');
};

testBackend(); 