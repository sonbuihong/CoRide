// Goong Maps API Configuration
export const GOONG_CONFIG = {
  // Maps API Key - Dùng để hiển thị bản đồ trên mobile app
  MAPTILES_KEY: process.env.EXPO_PUBLIC_GOONG_MAPTILES_KEY || '',
  
  // Backend API URL - Các dịch vụ REST API sẽ gọi qua backend
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api',
};

export default GOONG_CONFIG;

