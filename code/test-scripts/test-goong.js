const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Đọc trực tiếp file .env của web để lấy Map API Key
const envPath = path.join(__dirname, '..', 'apps', 'web', '.env.local');
let envConfig = {};

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || '';
      value = value.replace(/^['"](.*)['"]$/, '$1'); 
      envConfig[key] = value.trim();
    }
  });
  console.log('✅ Đã load cấu hình từ apps/web/.env.local');
} else {
  console.log('❌ Không tìm thấy file .env.local tại', envPath);
  process.exit(1);
}

const GOONG_MAPS_API_KEY = envConfig.NEXT_PUBLIC_GOONG_MAPTILES_KEY;

async function testGoongMapAPI() {
  console.log(`\n======================================================`);
  console.log(`TEST TRỰC TIẾP API MAP CỦA GOONG (XÁC MINH MAP API KEY)`);
  console.log(`======================================================`);

  if (!GOONG_MAPS_API_KEY) {
    console.log('❌ Không tìm thấy GOONG_MAPS_API_KEY trong .env');
    return;
  } 

  try {
    console.log(`Đang kiểm tra key: ${GOONG_MAPS_API_KEY.substring(0, 5)}...`);
    // Gọi đến endpoint lấy style map (vector tiles) để kiểm chứng API Key của maptiles có hiệu lực
    const mapRes = await axios.get(`https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAPS_API_KEY}`);
    
    console.log('\n✅ GOONG_MAPS_API_KEY hợp lệ! (Lấy map style thành công)');
    console.log(`   - Tên Map: ${mapRes.data.name}`);
    console.log(`   - Version: ${mapRes.data.version}`);
    console.log(`   - Nguồn dữ liệu (Sources):`, Object.keys(mapRes.data.sources || {}).join(', '));
  } catch (error) {
    console.error('\n❌ Lỗi Map API Key:', error.response?.data?.error?.message || error.message);
  }
}

testGoongMapAPI();
