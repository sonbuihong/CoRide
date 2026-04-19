---
phase: 09-business-integration
plan: 02
subsystem: Web Frontend
tags: [ui, maps, autocomplete, apple-design]
requirements: [BIZ-01]
key-files: [code/apps/web/src/components/ui/address-autocomplete.tsx, code/apps/web/src/components/rides/search-form.tsx]
tech-stack: [Next.js, Google Maps, Tailwind CSS]
---

# Phase 09 Plan 02: Tinh chỉnh UI Component & Tích hợp Tìm kiếm Summary

Tích hợp Google Maps Places Autocomplete vào form tìm kiếm chuyến đi với giao diện chuẩn Apple Design.

## Kết quả đạt được

### 1. Nâng cấp AddressAutocomplete
- Thêm prop `inputClassName` cho phép tùy biến style của ô nhập liệu từ bên ngoài.
- Cập nhật giao diện dropdown gợi ý địa chỉ:
  - Sử dụng `backdrop-blur-md` và độ trong suốt `bg-white/80` / `bg-[#1d1d1f]/80`.
  - Bo góc `rounded-[12px]` và đổ bóng `shadow-[0_8px_30px_rgba(0,0,0,0.12)]`.
  - Hiệu ứng hover và border mượt mà theo phong cách Apple.

### 2. Tích hợp vào SearchForm
- Thay thế các ô nhập liệu "Điểm đi" và "Điểm đến" truyền thống bằng `AddressAutocomplete`.
- Sử dụng `setValue` từ `react-hook-form` để cập nhật trạng thái form khi người dùng chọn địa chỉ từ danh sách gợi ý.
- Áp dụng `appleInputClass` nhất quán với toàn bộ form, đảm bảo trải nghiệm người dùng liền mạch.

## Quyết định kỹ thuật
- **Styling:** Sử dụng `backdrop-blur` cho dropdown để tạo cảm giác chiều sâu (depth) giống như các menu trên iOS/macOS.
- **Form Integration:** Sử dụng `setValue` thay vì `register` trực tiếp cho `AddressAutocomplete` vì đây là một controlled component phức tạp kết hợp với Google Maps API.

## Deviations from Plan
- **None:** Kế hoạch được thực hiện đầy đủ và đúng hạn.

## Commits
- `apps/web@b95f2e1`: feat(09-02): upgrade AddressAutocomplete with custom styling support
- `apps/web@a08bd05`: feat(09-02): integrate AddressAutocomplete into SearchForm

## Self-Check: PASSED
- [x] AddressAutocomplete hỗ trợ custom style cho input.
- [x] SearchForm sử dụng AddressAutocomplete thay cho input text truyền thống.
- [x] Các commit đã được thực hiện trong repo `apps/web`.
