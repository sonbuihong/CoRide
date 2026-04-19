---
name: fix-bug-workflow
description: Workflow có cấu trúc để trace, phân tích root cause, fix bug, và viết test ngăn regression
---

# Skill: Fix Bug Workflow

## Khi nào dùng

Kích hoạt khi người dùng báo cáo bug, lỗi, hoặc behavior không mong đợi.

## Bước 1 — Thu thập thông tin (Information Gathering)

Hỏi user nếu chưa có:

```
1. Mô tả lỗi cụ thể là gì?
2. Reproduce steps (các bước tái hiện lỗi)?
3. Expected behavior (mong đợi gì)?
4. Actual behavior (thực tế là gì)?
5. Error message / stack trace (nếu có)?
6. Môi trường: development / staging / production?
7. Lần cuối hoạt động đúng là khi nào?
```

## Bước 2 — Phân tích sơ bộ (Initial Analysis)

```
Kiểm tra theo thứ tự:

1. Recent changes → git log --oneline -20
   → Commit nào gần nhất có thể gây ra?

2. Error log → Tìm stack trace liên quan
   → Xác định file:line xảy ra lỗi

3. Reproduce locally → Tái hiện lỗi trên máy local
   → Xác nhận lỗi có thể reproduce được

4. Narrow down scope → Lỗi ở layer nào?
   → Controller? Service? Repository? Database?
```

## Bước 3 — Root Cause Analysis

Đi theo call chain từ điểm lỗi ngược lên:

```
User request
    → Controller (validate input?)
        → Service (business logic đúng không?)
            → Repository (query đúng không?)
                → Database (data đúng không?)
```

Trình bày kết quả:
```
ROOT CAUSE:
- Vị trí: [file]:[line]
- Nguyên nhân: [giải thích kỹ thuật]
- Tại sao bug lọt qua: [không có test? edge case chưa nghĩ đến?]
```

## Bước 4 — Đề xuất Fix

```
PHƯƠNG ÁN FIX:

Option A (Recommended):
- Thay đổi gì: [mô tả]
- Tại sao: [reasoning]
- Trade-off: [được / mất]

Option B (Alternative):
- Thay đổi gì: [mô tả]
- Tại sao ít ưu tiên hơn: [reasoning]

Side effects cần kiểm tra:
- Module X có bị ảnh hưởng không?
- API contract có thay đổi không?
- Có cần migration không?
```

## Bước 5 — Implement Fix

```typescript
// Trước khi fix — viết failing test trước (TDD)
it('nên [behavior đúng]', async () => {
  // Test này phải FAIL trước khi fix
  const result = await service.method(input);
  expect(result).toBe(expectedValue);
});

// Sau đó mới sửa code
// Code fix ngắn gọn, đúng trọng tâm, không thừa
```

## Bước 6 — Verify & Test

```bash
# 1. Chạy test liên quan
npm test -- --testPathPattern=[affected-module]

# 2. Chạy full test suite
npm test

# 3. Manual test reproduce steps

# 4. Kiểm tra edge cases liên quan
```

## Bước 7 — Document Fix

Commit message theo convention:
```
fix([scope]): [mô tả ngắn gọn bug đã fix]

Root cause: [1-2 câu giải thích nguyên nhân]
Fix: [1-2 câu mô tả cách fix]

Closes #[issue-number]
```

## Checklist hoàn thành

- [ ] Lỗi đã được reproduce
- [ ] Root cause đã xác định
- [ ] Fix đã implement
- [ ] Test cho bug case đã viết (và pass)
- [ ] Full test suite pass
- [ ] Code review (nếu cần)
- [ ] Deploy và verify trên staging
