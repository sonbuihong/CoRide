import { PrismaClient } from '@prisma/client';

// Khởi tạo PrismaClient singleton
// Giúp tránh lỗi too many connections khi dùng hot-reload (development)
const prisma = new PrismaClient();

export default prisma;
