import { EventEmitter } from 'events';

// Singleton EventEmitter để SSE (Server-Sent Events) hoạt động trong cùng process.
// Service tạo notification → emit event → SSE controller push về client ngay lập tức.
class NotificationEmitter extends EventEmitter {}

export const notificationEmitter = new NotificationEmitter();
