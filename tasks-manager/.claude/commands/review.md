---
description: Review code thay đổi — kiểm tra chất lượng, bảo mật, và convention
---

# Command: /review

## Mô tả

Review code trước khi merge. Kiểm tra toàn diện: logic, security, performance, style.

## Cách dùng

```
/review [file hoặc diff]
```

## Checklist Review

### Correctness (Logic đúng không?)
- [ ] Code làm đúng yêu cầu không?
- [ ] Các edge case đã được xử lý (null, empty, max limit)?
- [ ] Không có off-by-one error?
- [ ] Async/await được dùng đúng, không bị race condition?

### Security (Bảo mật)
- [ ] Input từ user đã được validate và sanitize?
- [ ] Không có hardcoded secret / credential?
- [ ] Authorization check đúng chỗ (không chỉ authentication)?
- [ ] Không expose thông tin nhạy cảm trong response / log?

### Performance (Hiệu năng)
- [ ] Không có N+1 query?
- [ ] Dữ liệu lớn có được paginate không?
- [ ] Có cache ở những chỗ cần thiết?
- [ ] Không có vòng lặp không cần thiết?

### Code Quality (Chất lượng code)
- [ ] Tên biến / hàm có ý nghĩa, tự giải thích (self-documenting)?
- [ ] Không có dead code, commented-out code?
- [ ] Hàm có quá dài không? (> 40 dòng thì xem xét tách)
- [ ] Logic phức tạp có comment giải thích "tại sao" không?

### Testing
- [ ] Có test cho happy path?
- [ ] Có test cho error path và edge cases?
- [ ] Test có meaningful assertion hay chỉ test implementation?

## Output format

```
## Tổng quan: [APPROVE / REQUEST CHANGES / NEEDS DISCUSSION]

### Vấn đề cần sửa (bắt buộc)
- [CRITICAL] ...
- [HIGH] ...

### Gợi ý cải thiện (không bắt buộc)
- [MEDIUM] ...
- [LOW] ...

### Điểm tốt
- ...
```
