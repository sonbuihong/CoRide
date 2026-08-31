# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

CoRide phục vụ hành khách và tài xế đi chung xe. Surface hiện tại ưu tiên tài xế cần quét nhanh trạng thái hoạt động, yêu cầu đặt chỗ và lịch trình trong khi đang di chuyển.

## Product Purpose

CoRide giúp tài xế chia sẻ hành trình có sẵn, tìm hành khách cùng tuyến và tối ưu chi phí di chuyển. Home tài xế thành công khi người dùng hiểu trạng thái hiện tại và thực hiện tác vụ ưu tiên trong vài giây.

## Operating Context

Tài xế sử dụng ứng dụng trên điện thoại, thường trong những khoảng tương tác ngắn. Các luồng cốt lõi gồm bật/tắt nhận cuốc, đăng chuyến, duyệt yêu cầu đặt chỗ, xem chuyến sắp tới, theo dõi chuyến đang chạy và truy cập ví, tin nhắn, phương tiện.

## Capabilities and Constraints

- React Native + Expo Router, chạy trên Android, iOS và web.
- Dữ liệu home đến từ API rides, bookings và trips; socket giữ dữ liệu gần realtime.
- Giữ nguyên các route, query key và nghiệp vụ đang hoạt động.
- Giao diện phải responsive, hỗ trợ font scaling và touch target tối thiểu theo nền tảng.

## Brand Commitments

- Tên CoRide và màu xanh lá thương hiệu.
- Giọng điệu rõ ràng, thân thiện, đáng tin cậy.
- Ảnh reference do người dùng cung cấp là chuẩn chính cho cấu trúc và tinh thần visual của Driver Home.

## Evidence on Hand

- Reference: `D:\OneDrive\Pictures\Screenshots 1\292030d0-d688-4c11-a8d9-8990a34d6136.png`.
- Dữ liệu sản phẩm thật từ các model `Ride`, `DriverBookingSummary`, user profile và active trip hiện có trong source.
- Không được bịa số liệu vận hành; overview phải được suy ra từ dữ liệu hiện có hoặc thể hiện trạng thái rỗng.

## Product Principles

- Ưu tiên tác vụ đang cần hành động.
- Realtime nhưng không gây nhiễu hoặc gọi mạng thừa.
- Một hierarchy nhất quán từ trạng thái đến hành động và chi tiết.
- Thành phần tái sử dụng được, trạng thái loading/error/empty rõ ràng.

## Accessibility & Inclusion

CTA có nhãn truy cập, tương phản rõ, touch target ít nhất 44 pt trên iOS và 48 dp trên Android; nội dung quan trọng không chỉ truyền đạt bằng màu sắc.
