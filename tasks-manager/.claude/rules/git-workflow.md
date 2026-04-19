# Git Workflow

Quy trình làm việc với Git cho module Tasks Manager.

## Branching Strategy (Git Flow đơn giản hóa)

```
main           ← Production (luôn ổn định, chỉ merge từ develop)
  └── develop  ← Integration branch (staging)
        ├── feature/TM-123-add-task-priority
        ├── fix/TM-456-fix-due-date-validation
        └── hotfix/TM-789-critical-auth-bug
```

### Quy tắc branch
- `main` — Protected. Chỉ CI/CD merge vào sau khi pass all checks
- `develop` — Base branch cho mọi feature/fix
- `feature/*` — Tính năng mới
- `fix/*` — Sửa bug thông thường
- `hotfix/*` — Sửa lỗi critical trên production (branch từ `main`)

## Branch Naming

```
[type]/[ticket-id]-[mô-tả-ngắn-kebab-case]

feature/TM-101-add-task-labels
fix/TM-202-fix-pagination-offset
hotfix/TM-303-fix-auth-token-expiry
refactor/TM-404-extract-notification-service
chore/update-dependencies
```

## Commit Convention (Conventional Commits)

```
[type]([scope]): [mô tả ngắn]

[body — giải thích nếu cần]

[footer — breaking change, closes ticket]
```

### Types
| Type       | Khi nào dùng                                      |
|------------|--------------------------------------------------|
| `feat`     | Thêm tính năng mới                               |
| `fix`      | Sửa lỗi                                          |
| `refactor` | Cải thiện code, không thay đổi behavior          |
| `test`     | Thêm/sửa test                                    |
| `docs`     | Cập nhật documentation                           |
| `chore`    | Việc vặt: update deps, config, CI/CD...          |
| `perf`     | Cải thiện hiệu năng                              |
| `revert`   | Revert commit trước                              |

### Ví dụ commit messages tốt
```
feat(task): thêm chức năng gán nhãn cho task

Cho phép user gán nhiều label vào một task.
Label được lưu dưới dạng many-to-many với bảng task_labels.

Closes TM-101

---

fix(auth): sửa lỗi JWT không refresh đúng khi token hết hạn

Token cũ vẫn được chấp nhận do thiếu kiểm tra exp claim.
Thêm middleware kiểm tra exp trước khi xử lý request.

Closes TM-202

---

feat!: thay đổi response format của GET /tasks

BREAKING CHANGE: field "items" đổi thành "data" để đồng nhất với API convention.
```

### Commit messages tệ (Không dùng)
```
fix bug
update code
wip
asdf
test 123
```

## Pull Request

### Trước khi tạo PR
- [ ] Rebase lên develop mới nhất: `git rebase develop`
- [ ] Tất cả test pass: `npm test`
- [ ] Lint sạch: `npm run lint`
- [ ] Tự review diff của mình một lần

### PR Title
```
[TM-123] feat: thêm chức năng gán nhãn cho task
```

### PR Description Template
```markdown
## Thay đổi gì?
[Mô tả ngắn gọn]

## Tại sao?
[Context / business reason]

## Cách test
1. ...
2. ...

## Checklist
- [ ] Tests pass
- [ ] Không có `console.log` debug
- [ ] Đã update CHANGELOG (nếu cần)
- [ ] Breaking changes đã được ghi chú
```

### Code Review Rules
- PR phải có ít nhất **1 approval** trước khi merge
- Author không tự merge PR của mình (trừ hotfix khẩn cấp)
- Giải quyết mọi comment trước khi merge

## Hotfix Process

```bash
# 1. Branch từ main
git checkout main
git pull origin main
git checkout -b hotfix/TM-999-critical-bug

# 2. Fix và commit
git commit -m "fix(auth): sửa lỗi bypass authentication"

# 3. Merge vào cả main VÀ develop
git checkout main && git merge hotfix/TM-999-critical-bug
git checkout develop && git merge hotfix/TM-999-critical-bug

# 4. Tag version mới trên main
git tag v1.2.1
git push origin main develop --tags
```
