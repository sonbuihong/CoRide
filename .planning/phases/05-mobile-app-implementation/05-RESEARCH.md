# Phase 5: Mobile App Implementation - Research

**Researched:** 2024-05-23
**Domain:** Cross-platform Mobile development, Expo SDK, Nativewind, Push Notifications
**Confidence:** HIGH

## Summary

Giai đoạn 5 tập trung vào việc hiện thực hóa ứng dụng di động CoRide bằng **Expo (React Native)**. 

Ứng dụng sẽ sử dụng **Expo Router** cho việc điều hướng dựa trên file (file-based navigation), tạo sự đồng nhất với cấu trúc Next.js của Web app. Giao diện sẽ được xây dựng bằng **Nativewind v4** (Tailwind CSS cho React Native) để tái sử dụng tối đa tư duy styling từ Web.

Hệ thống xác thực sẽ sử dụng **Expo SecureStore** để lưu trữ token an toàn và tích hợp trực tiếp với Backend Auth API đã có. Việc hiển thị bản đồ và tìm kiếm vị trí sẽ sử dụng **react-native-maps** cùng với **Google Maps SDK**.

Thông báo đẩy (Push Notifications) sẽ được tích hợp thông qua **Expo Notifications** để đảm bảo người dùng nhận được cập nhật về chuyến đi ngay cả khi ứng dụng đang ở chế độ nền.

**Primary recommendation:** Sử dụng Expo SDK 50+, Expo Router v3, Nativewind v4 và react-native-maps.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MOB-01 | Thiết lập dự án Expo với TypeScript | Xem Standard Stack: Core. |
| MOB-02 | Cấu trúc Navigation với Expo Router | Xem Architecture Patterns: Navigation. |
| MOB-03 | Tích hợp Auth (Login/Register/Logout) | Xem Pattern: Secure Auth Storage. |
| MOB-04 | Tìm kiếm và Đặt chuyến đi (Passenger Flow) | Xem Code Examples: Map Integration. |
| MOB-05 | Đăng chuyến đi và Quản lý yêu cầu (Driver Flow) | Xem Architecture Patterns. |
| MOB-06 | Tích hợp Push Notifications | Xem Standard Stack: Supporting. |
| MOB-07 | Tích hợp SSE cho Thông báo thời gian thực | Xem Common Pitfalls: SSE on Mobile. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Expo SDK | 50+ | Development Framework | Easy setup, OTA updates, rich ecosystem. |
| Expo Router | v3+ | Navigation | File-based, deep linking support, Next.js-like. |
| Nativewind | v4 (Alpha/Beta) | Styling | Tailwind CSS for RN, high developer velocity. |
| Lucide React Native | Latest | Icons | Consistency with Lucide React on Web. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| Axios | ^1.6.0 | API Client | Better interceptors and shared config with Web. |
| TanStack Query | ^5.0.0 | Data Fetching | Caching, synchronization, and loading states. |
| Expo SecureStore | Latest | Auth Storage | Secure storage for JWT tokens. |
| React Native Maps | Latest | Maps & Location | Native map support (Google/Apple Maps). |
| Expo Notifications | Latest | Push Notifications | Centralized service for iOS/Android notifications. |
| react-native-eventsource | Latest | SSE Client | Polyfill for SSE on React Native. |

**Installation:**
```bash
# Mobile Init (sẽ thực hiện trong 05-01-PLAN)
npx create-expo-app@latest apps/mobile --template tabs
cd apps/mobile
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
npx expo install nativewind tailwindcss react-native-reanimated react-native-svg
```

## Architecture Patterns

### Recommended Project Structure
```
apps/mobile/
├── app/                  # Expo Router directory (screens)
│   ├── (auth)/           # Login, Register
│   ├── (tabs)/           # Main navigation (Home, My Rides, Profile)
│   ├── ride/             # Ride details, Booking
│   └── _layout.tsx       # Root layout
├── src/
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom hooks (useAuth, useRide)
│   ├── services/         # API services (authService, rideService)
│   ├── store/            # State management (Zustand or Context)
│   └── utils/            # Helpers
└── tailwind.config.js    # Nativewind config
```

### Pattern: Shared Logic with Packages
**What:** Sử dụng trực tiếp các Zod schemas từ `packages/shared` để validate form trên Mobile.
**Why:** Đảm bảo tính nhất quán (Single Source of Truth) giữa Frontend/Backend/Mobile.

### Pattern: Secure Auth Storage
**What:** Sử dụng `Expo SecureStore` để lưu JWT. Tạo một `AuthContext` để quản lý trạng thái login toàn app.
**Example:** [Xem Code Examples](#auth-storage-with-securestore)

### Anti-Patterns to Avoid
- **AsyncStorage for Secrets:** Không bao giờ lưu JWT token trong `AsyncStorage` (không mã hóa).
- **Inline Styling:** Tránh dùng `style={{...}}` quá nhiều. Sử dụng Nativewind classes để dễ bảo trì.
- **Heavy Map Re-renders:** Tránh re-render `MapView` không cần thiết bằng cách memoize markers.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Navigation | Custom state-based navigation | Expo Router | Production-ready, native feel, automatic deep linking. |
| Forms | Custom validation logic | React Hook Form + Zod | Industry standard, lightweight, shared schemas. |
| Image Picker | Custom bridge to native | expo-image-picker | Easy to use, cross-platform, handles permissions. |

## Common Pitfalls

### Pitfall 1: SSE on Mobile
**What goes wrong:** React Native không hỗ trợ `EventSource` nguyên bản.
**Why it happens:** Kiến trúc JS engine của RN khác với Browser.
**How to avoid:** Sử dụng thư viện `react-native-eventsource` và cấu trúc reconnection logic chặt chẽ.

### Pitfall 2: Android Emulator & Localhost
**What goes wrong:** Không thể kết nối tới Backend qua `http://localhost:5000`.
**Why it happens:** Android emulator coi `localhost` là chính nó.
**How to avoid:** Sử dụng IP máy tính (e.g., `192.168.1.x`) hoặc công cụ như **ngrok**.

## Code Examples

### Auth Storage with SecureStore
```typescript
// apps/mobile/src/services/auth-storage.ts
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'coride_auth_token';

export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async () => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};
```

### Map Integration Snippet
```tsx
// apps/mobile/src/components/RideMap.tsx
import MapView, { Marker, Polyline } from 'react-native-maps';

export const RideMap = ({ origin, destination }) => (
  <MapView
    style={{ flex: 1 }}
    initialRegion={{
      latitude: origin.lat,
      longitude: origin.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }}
  >
    <Marker coordinate={{ latitude: origin.lat, longitude: origin.lng }} title="Điểm đi" />
    <Marker coordinate={{ latitude: destination.lat, longitude: destination.lng }} title="Điểm đến" />
  </MapView>
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Navigation | Expo Router | 2023+ | File-based, simpler, better SEO/Deep-linking. |
| StyleSheets | Nativewind v4 | 2023+ | Tailwind speed, unified CSS-like styling. |
| FCM Direct | Expo Notifications | 2022+ | Simpler API, managed workflow support. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Backend API endpoint is accessible via local network IP | Common Pitfalls | Android emulator setup might be tricky. |
| A2 | Shared schemas are compatible with React Native environment | Pattern: Shared Logic | Some Zod features might behave differently (rare). |

## Open Questions

1. **Google Maps API Key:** Cần chuẩn bị API Key cho cả Android (SHA-1) và iOS (Bundle ID).
2. **Push Notifications Credentials:** Cần thiết lập tài khoản Expo (EAS) để gửi thông báo đẩy.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Expo CLI | Development | ✓ | Latest | — |
| Node.js | Backend/Build | ✓ | 20.x | — |
| Android Studio / Xcode | Testing | ✓ | Latest | Physical device |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V9 Communication Security | yes | Always use HTTPS in production. |
| V10 Malicious Code | no | — |
| V11 Business Logic | yes | Validation on Mobile + Server-side enforcement. |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Token Theft | Info Disclosure | Store in SecureStore, never in AsyncStorage. |
| Insecure API calls | Spoofing | SSL Pinning (optional but recommended for production). |

## Sources

### Primary (HIGH confidence)
- Expo Documentation (SDK 50)
- Expo Router Documentation
- Nativewind v4 Documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Expo is extremely mature.
- Architecture: HIGH - Expo Router is now the standard for Expo apps.
- Pitfalls: MEDIUM - Localhost networking is always a pain point for beginners.

**Research date:** 2024-05-23
**Valid until:** 2024-11-23
