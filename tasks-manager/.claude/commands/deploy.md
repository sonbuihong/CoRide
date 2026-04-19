---
description: Deploy ứng dụng tasks-manager lên môi trường target
---

# Command: /deploy

## Mô tả

Deploy module tasks-manager. Tự động chạy qua các bước: kiểm tra code → build → deploy → xác nhận.

## Cách dùng

```
/deploy [environment]
```

- `environment`: `staging` (mặc định) | `production`

## Workflow thực thi

### Bước 1 — Pre-deploy Checklist
- [ ] Kiểm tra không có uncommitted changes
- [ ] Chạy toàn bộ test suite và xác nhận pass
- [ ] Kiểm tra biến môi trường đầy đủ (so với `.env.example`)
- [ ] Review CHANGELOG / migration scripts chưa chạy

### Bước 2 — Build
```bash
# Cài dependency
npm ci --production

# Build production bundle
npm run build

# Kiểm tra build output
ls -la dist/
```

### Bước 3 — Database Migration
```bash
# Backup DB trước khi migrate (production)
npm run db:backup

# Chạy migration
npm run db:migrate
```

### Bước 4 — Deploy Container
```bash
# Build Docker image
docker build -t coride/tasks-manager:$(git rev-parse --short HEAD) .

# Push lên registry
docker push coride/tasks-manager:$(git rev-parse --short HEAD)

# Restart service
docker-compose -f docker-compose.prod.yml up -d --no-deps tasks-manager
```

### Bước 5 — Post-deploy Verification
- [ ] Health check endpoint trả về 200
- [ ] Kiểm tra log 2 phút không có ERROR
- [ ] Smoke test các luồng chính

## Rollback

Nếu có sự cố:
```bash
# Rollback về image trước
docker-compose -f docker-compose.prod.yml up -d --no-deps tasks-manager:<previous-tag>
```
