# Walkthrough: Authentication & Profile (Giai đoạn 5)

## 1. Xác minh Foundation (Giai đoạn 3 & 4)

Trước khi bắt tay vào triển khai Giai đoạn 5, tôi đã thực hiện xác minh lại toàn bộ mã nguồn của Mobile app.
- **Typecheck**: Pass hoàn toàn (`tsc --noEmit` exit code 0). Đã sửa tất cả các import path bị sai từ việc refactor cũ.
- **Lint**: Đã loại bỏ hoàn toàn các lỗi lặp import, React Hook exhaustive-deps. Chỉ còn lại 15 warnings liên quan đến biến không sử dụng (unused variables) như `router`, `useState`, `error`, và một số warning về style (`Array<T>` vs `T[]`). Các warning này không ảnh hưởng đến runtime và sẽ được cleanup dần trong quá trình phát triển các module tương ứng.
- **Expo Doctor**: Báo cáo an toàn, chỉ yêu cầu cài đặt thêm `react-native-svg` (đã cài đặt).

## 2. Triển khai Kiến trúc Authentication (4 Lớp)

Theo đúng yêu cầu kiến trúc, tôi đã xây dựng Authentication flow qua 4 lớp chặt chẽ:

### Lớp 1: SecureStore (`src/services/secure-store.ts`)
- Đóng vai trò là nơi lưu trữ **duy nhất** cho Access Token.
- Hỗ trợ đầy đủ các hàm get/set/remove token an toàn qua API của `expo-secure-store`.
- **Lưu ý quan trọng**: Vì backend hiện tại sử dụng cơ chế `httpOnly` cookie để chứa Refresh Token, tôi đã tuân thủ thiết kế này. OS của React Native sẽ tự động lưu và gửi cookie này trong các request `axios` (với cùng domain), do đó ta không cần tự parse cookie lưu vào SecureStore để đảm bảo an toàn tối đa.

### Lớp 2: API Client với Safe Refresh Token Interceptor (`src/api/client.ts`)
- **Quản lý Token**: Tự động đính kèm `Bearer token` vào header (ngoại trừ các public endpoint như `/auth/login`, `/auth/register`).
- **Cơ chế Refresh An Toàn**: 
  - Khi bắt được lỗi `401 Unauthorized`, interceptor sẽ tự động kiểm tra biến cờ `isRefreshing` để tránh lặp (Race condition). 
  - Nếu đang có request refresh chạy, các request khác sẽ được đẩy vào một `failedQueue` để đợi kết quả.
  - Khi refresh thành công, token mới được lưu và retry tự động các request trong queue.
  - Nếu refresh thất bại, toàn bộ token bị xóa, gọi logout cục bộ và điều hướng về trang Login.

### Lớp 3: Authentication Service (`src/services/auth.service.ts`)
- Khai báo các endpoint kết nối trực tiếp với Backend (`login`, `register`, `logout`, `getCurrentUser`, `updateProfile`, `uploadAvatar`).
- Đảm bảo input và output match hoàn toàn với backend (`User` interface tự định nghĩa chính xác theo Prisma schema thực tế).

### Lớp 4: Auth Provider & Zustand Store (`src/hooks/useAuth.ts` & `src/stores/useAuthStore.ts`)
- **Tách biệt State**: `useAuthStore` chỉ chịu trách nhiệm quản lý `status` (`BOOTING`, `AUTHENTICATED`, `UNAUTHENTICATED`) và trạng thái `isLoggingOut`.
- **React Query làm Nguồn Dữ Liệu**: `useAuth` hook tận dụng `useQuery({ queryKey: authKeys.me(), queryFn: getCurrentUser })` để fetch, lưu cache và đồng bộ dữ liệu người dùng. Tuyệt đối không dùng Zustand để lưu thông tin user profile.

## 3. Giao diện (UI)

- **Đăng nhập (`app/(auth)/login.tsx`)**: 
  - Validate form qua Zod (`loginSchema`).
  - Khi đăng nhập thành công, token được lưu và Navigation Guard ở `_layout.tsx` tự động redirect về `/(tabs)`.
- **Đăng ký (`app/(auth)/register.tsx`)**: 
  - Tích hợp `registerSchema` (bao gồm confirmPassword).
  - Trước khi gửi đi, `confirmPassword` được bóc tách ra khỏi payload để đảm bảo API backend hoạt động chuẩn xác.
- **Profile (`app/(tabs)/profile.tsx`) & Edit Profile (`app/profile/edit.tsx`)**:
  - Giao diện lấy dữ liệu từ `user` trong hook `useAuth`.
  - Hỗ trợ đổi ảnh đại diện qua `expo-image-picker` kết nối với API `/users/me/avatar` (dạng `multipart/form-data`).
  - Hỗ trợ cập nhật thông tin cá nhân.
  - Khi API cập nhật thành công, gọi `queryClient.setQueryData(authKeys.me(), updatedUser)` để UI cập nhật ngay tức khắc mà không cần reload.

## 4. Kiểm thử Tự động (Verification)
- ✅ `pnpm --filter @repo/mobile typecheck` **[PASS]**
- ✅ `pnpm --filter @repo/mobile lint` **[PASS]** (Không có lỗi, chỉ còn 15 warning an toàn).

Giai đoạn 5 đã hoàn thành toàn diện và đúng theo các yêu cầu khắt khe về kiến trúc. Bạn có thể sử dụng UI app để bắt đầu test luồng đăng nhập và cập nhật profile.
