---
description: Phân tích và sửa bug/issue trong codebase tasks-manager
---

# Command: /fix-issue

## Mô tả

Nhận mô tả lỗi hoặc issue number → tự động trace → đề xuất fix → viết test.

## Cách dùng

```
/fix-issue [mô tả lỗi hoặc #issue-number]
```

## Workflow thực thi

### Bước 1 — Thu thập thông tin
Hỏi người dùng nếu thiếu:
- Lỗi xảy ra ở đâu? (endpoint / component / function)
- Reproduce steps là gì?
- Log / error message cụ thể?
- Môi trường: development / staging / production?

### Bước 2 — Phân tích nguyên nhân gốc rễ (Root Cause Analysis)

```
Khám phá theo thứ tự:
1. Đọc error stack trace → xác định dòng lỗi
2. Trace ngược call chain → tìm nơi data bị sai
3. Kiểm tra recent commits → có thay đổi nào gây ra không?
4. Kiểm tra edge cases → null, undefined, empty array...
```

### Bước 3 — Đề xuất Fix

Trình bày fix theo format:
```
NGUYÊN NHÂN: [giải thích ngắn gọn]

FIX:
- File: [đường dẫn]
- Thay đổi: [diff hoặc mô tả]
- Lý do: [tại sao cách fix này đúng]

SIDE EFFECTS cần kiểm tra:
- [danh sách các nơi có thể bị ảnh hưởng]
```

### Bước 4 — Viết Test

Tạo test case bao gồm:
- Happy path (case bình thường)
- Bug case (reproduce lỗi cũ — phải fail trước fix)
- Edge cases liên quan

### Bước 5 — Verification
```bash
# Chạy test liên quan
npm test -- --testPathPattern=[affected-module]

# Chạy linter
npm run lint
```
