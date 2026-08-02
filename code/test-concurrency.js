const axios = require('axios');

const API_URL = 'http://localhost:3000/api'; // Replace with actual backend URL
const TOKEN = 'Bearer YOUR_TEST_TOKEN'; // Replace with a valid test token
const RIDE_ID = 1; // ID of the ride with 1 available seat
const PASSENGER_IDS = Array.from({ length: 100 }, (_, i) => i + 100); // Generate 100 fake passenger IDs

async function runConcurrencyTest(numRequests) {
  console.log(`Starting concurrency test with ${numRequests} requests...`);
  const passengers = PASSENGER_IDS.slice(0, numRequests);
  
  // Prepare all requests to be sent at the exact same time
  const requests = passengers.map(passengerId => 
    axios.post(`${API_URL}/rides/${RIDE_ID}/book`, {
      passengerId: passengerId,
      requestedSeats: 1
    }, {
      headers: { Authorization: TOKEN }
    }).then(res => ({ status: 'fulfilled', data: res.data }))
      .catch(err => ({ status: 'rejected', error: err.response?.data || err.message }))
  );

  const results = await Promise.all(requests);
  
  const successful = results.filter(r => r.status === 'fulfilled');
  const rejected = results.filter(r => r.status === 'rejected');
  
  console.log(`Test completed for ${numRequests} requests.`);
  console.log(`- Successful: ${successful.length}`);
  console.log(`- Rejected: ${rejected.length}`);
  
  // In a real run, we would also query the DB to verify availableSeats === 0 and overbooking === 0
  return {
    numRequests,
    successful: successful.length,
    rejected: rejected.length
  };
}

async function main() {
  await runConcurrencyTest(10);
  console.log('---');
  await runConcurrencyTest(50);
  console.log('---');
  await runConcurrencyTest(100);
}

// Uncomment to run
// main().catch(console.error);
