# Kế hoạch Triển khai Mobile Giai đoạn 5: Authentication & Profile

- [x] Chạy expo-doctor và khắc phục các vấn đề liên quan đến thư viện (cài đặt react-native-svg).
- [x] Chạy lint và typecheck để sửa dứt điểm các lỗi hook warning và import type.
- [x] Tạo `src/services/secure-store.ts` chuyên dụng để quản lý Access Token.
- [x] Tạo `src/api/client.ts` chứa cấu hình Axios và Safe Refresh Token Interceptor chặn lỗi 401 hiệu quả.
- [x] Tạo `src/services/auth.service.ts` định nghĩa các hàm gọi API theo đúng RESTful từ backend.
- [x] Tạo `src/stores/useAuthStore.ts` quản lý AuthStatus ('BOOTING' | 'AUTHENTICATED' | 'UNAUTHENTICATED').
- [x] Viết `src/hooks/useAuth.ts` chứa logic checkAuth, login, register, logout và nạp user từ React Query.
- [x] Xây dựng UI màn hình Login tại `app/(auth)/login.tsx` với React Hook Form và Zod validator.
- [x] Xây dựng UI màn hình Register tại `app/(auth)/register.tsx`.
- [x] Xây dựng màn hình Profile tại `app/(tabs)/profile.tsx` tích hợp expo-image-picker.
- [x] Xây dựng màn hình Edit Profile tại `app/profile/edit.tsx` gọi hàm update thông qua API.
- [x] Chạy lại pnpm typecheck và pnpm lint, đảm bảo mọi thứ pass hoàn toàn.
