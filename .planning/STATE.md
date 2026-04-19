# STATE: CoRide

## Current Position

Phase: Phase 10 - Realtime Core
Plan: 10-01
Status: Not Started
Last activity: 2026-04-19 — Roadmap v1.2 Updated (Chuyển tiếp từ v1.1)

## Giai đoạn kế tiếp (Next Steps)
- Dựng hệ thống Socket.IO vào Backend `server.ts` / Module độc lập.
- Thiết kế context Provider cho Socket trong `apps/web`.
- Làm tính năng Realtime Notification cho luồng Đặt Chuyến đi mới.

## Ghi chú quan trọng (Important Notes)
- CoRide đã thay đổi hoàn toàn hệ thống MAP sang Open Source (Leaflet, Nominatim, OSRM). Giúp zero-cost và không còn bị chặn CORS hoặc bắt khai báo Credit Card từ Google.
- Trọng tâm hướng tới nay là **Realtime (WebSocket)** và sau đó sẽ là luồng **Payment (Thanh toán Sandbox)**.
- Toàn bộ hệ thống duy trì ngôn ngữ Tiếng Việt 100% từ giao diện đến tài liệu.
