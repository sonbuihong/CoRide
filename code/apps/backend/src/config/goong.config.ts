// Dùng getter để đọc env lazy — tránh bị evaluate trước dotenv.config()
// goong.service.ts import file này trước khi app.ts gọi dotenv.config()
// nên nếu dùng trực tiếp process.env sẽ bị rỗng
export const goongConfig = {
  get mapsApiKey() {
    return process.env.GOONG_MAPS_API_KEY || '';
  },
  
  get restApiKey() {
    return process.env.GOONG_REST_API_KEY || '';
  },
  
  // Base URL cho REST API
  baseUrl: 'https://rsapi.goong.io',
};

export default goongConfig;
