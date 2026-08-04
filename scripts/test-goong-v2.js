require('dotenv').config();
const axios = require('axios');

async function test() {
  try {
    const response = await axios.get(`https://rsapi.goong.io/v2/direction`, {
      params: {
        api_key: process.env.GOONG_API_KEY,
        origin: "21.028511,105.804817",
        destination: "21.022736,105.801944",
        vehicle: "car",
        alternatives: false,
      },
      timeout: 10000,
    });
    console.log("Success! Routes:", response.data.routes.length);
  } catch (error) {
    console.error("Error:", error.response ? error.response.status : error.message);
    if (error.response) console.error(error.response.data);
  }
}
test();
