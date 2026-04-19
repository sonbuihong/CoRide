---
name: deploy-workflow
description: Workflow tự động hoá quá trình deploy tasks-manager từ build đến verify
---

# Skill: Deploy Workflow

## Khi nào dùng

Kích hoạt khi người dùng yêu cầu deploy, release, hoặc đưa code lên môi trường.

## Các bước thực hiện

### Phase 1 — Validate (Kiểm tra trước khi deploy)

```bash
# 1. Không được có thay đổi chưa commit
git status --porcelain
# Nếu có output → dừng lại, hỏi user

# 2. Đảm bảo đang ở branch đúng
git branch --show-current
# feature/* → staging | main/develop → production/staging

# 3. Pull code mới nhất
git pull origin $(git branch --show-current)

# 4. Kiểm tra biến môi trường
# So sánh .env với .env.example — phải có đủ keys
```

### Phase 2 — Test & Quality Gate

```bash
# Cài dependency
npm ci

# Chạy linter
npm run lint
# Nếu có lỗi → dừng lại, báo cáo lỗi

# Chạy toàn bộ test
npm test -- --passWithNoTests
# Nếu fail → dừng lại, hiển thị test failures
```

### Phase 3 — Build

```bash
# Build production
npm run build

# Kiểm tra build thành công
if [ -d "dist" ]; then
  echo "Build thành công"
else
  echo "BUILD THẤT BẠI" && exit 1
fi
```

### Phase 4 — Database Migration

```bash
# Backup (chỉ production)
if [ "$DEPLOY_ENV" = "production" ]; then
  npm run db:backup
fi

# Chạy pending migrations
npm run db:migrate

# Verify migration thành công
npm run db:status
```

### Phase 5 — Container Deploy

```bash
# Tag theo git commit hash để traceability
IMAGE_TAG=$(git rev-parse --short HEAD)

# Build & push Docker image
docker build -t coride/tasks-manager:$IMAGE_TAG .
docker push coride/tasks-manager:$IMAGE_TAG

# Cập nhật service
docker-compose -f docker-compose.$DEPLOY_ENV.yml up -d \
  --no-deps \
  --force-recreate \
  tasks-manager
```

### Phase 6 — Health Check & Verify

```bash
# Chờ service khởi động
sleep 10

# Health check
HEALTH_URL="http://localhost:3000/api/v1/health"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ "$STATUS" = "200" ]; then
  echo "Deploy thành công!"
else
  echo "Health check THẤT BẠI (HTTP $STATUS) — bắt đầu rollback..."
  # Rollback
  docker-compose -f docker-compose.$DEPLOY_ENV.yml up -d \
    --no-deps tasks-manager:$PREVIOUS_TAG
fi
```

## Báo cáo sau deploy

Sau khi deploy xong, cung cấp summary:
```
DEPLOY SUMMARY
--------------
- Environment: staging/production
- Version: [git commit hash]
- Thời gian: [timestamp]
- Migrations: [số migration đã chạy]
- Status: SUCCESS / FAILED
- Health Check: OK / FAIL
```

## Rollback nhanh

Nếu phát hiện vấn đề sau deploy:
```bash
# Rollback về version trước
docker-compose up -d --no-deps tasks-manager:<previous-tag>
npm run db:migrate:undo  # Nếu cần undo migration
```
