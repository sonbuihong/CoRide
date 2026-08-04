# Scripts

Thư mục này chứa các script để test hệ thống.

## Hướng dẫn sử dụng test-goong-v2.js

File `test-goong-v2.js` yêu cầu biến môi trường `GOONG_API_KEY` để gọi API Goong.

1. Đảm bảo bạn có file `.env` ở cùng thư mục chứa script hoặc ở thư mục gốc của project, hoặc set trực tiếp trên terminal.
2. Thêm API key của bạn vào file `.env`:
   ```env
   GOONG_API_KEY=your_new_api_key_here
   ```
3. Cài đặt package `dotenv` và `axios` nếu chưa có:
   ```bash
   npm install dotenv axios
   ```
4. Chạy script:
   ```bash
   node test-goong-v2.js
   ```

*(Lưu ý: API key cứng cũ đã được gỡ bỏ khỏi file này vì lý do bảo mật. Vui lòng tạo key mới trên account.goong.io/keys)*
