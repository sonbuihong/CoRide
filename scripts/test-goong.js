const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5001/api/goong/directions', {
      origin: "21.028511,105.804817",
      destination: "21.022736,105.801944",
      vehicle: "car"
    });
    console.log("SUCCESS:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("ERROR:");
    console.error(err.response ? err.response.data : err.message);
  }
}

test();
