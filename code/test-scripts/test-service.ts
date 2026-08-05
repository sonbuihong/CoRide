const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'apps/backend/.env') });

const goongService = require('./apps/backend/src/modules/goong/goong.service').default;

async function test() {
  try {
    console.log("API Key loaded:", process.env.GOONG_REST_API_KEY);
    const result = await goongService.directions('21.028511,105.804817', '21.022736,105.801944', 'car');
    console.log("Result:", result ? "Success" : "Null");
  } catch(e) {
    console.error("Error:", e.message);
  }
}
test();
