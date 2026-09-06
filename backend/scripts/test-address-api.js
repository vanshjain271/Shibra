const axios = require('axios');

async function testAddressAPI() {
  const baseURL = 'http://localhost:5005/api/v1';
  let token = '';

  try {
    console.log('1. Logging in via Firebase Bypass...');
    const loginRes = await axios.post(`${baseURL}/auth/firebase-login`, {
      idToken: 'BYPASS_FIREBASE_AUTH'
    });
    token = loginRes.data.token;
    console.log('Login successful.');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('2. Adding address...');
    const addRes = await axios.post(`${baseURL}/addresses`, {
      name: 'Test User',
      phone: '9876543210',
      addressLine1: '123 Test St',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380001'
    }, { headers });
    
    const newAddressId = addRes.data.data._id;
    console.log(`Add address successful. ID: ${newAddressId}`);

    console.log('3. Getting addresses...');
    const getRes = await axios.get(`${baseURL}/addresses`, { headers });
    console.log(`Fetch successful. Count: ${getRes.data.count}`);

    console.log('4. Deleting test address...');
    await axios.delete(`${baseURL}/addresses/${newAddressId}`, { headers });
    console.log('Delete successful.');

    console.log('✅ ALL ADDRESS API TESTS PASSED');
  } catch (error) {
    console.error('❌ API Test Failed:');
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testAddressAPI();
