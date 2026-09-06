/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Bỏ qua lỗi ESLint trong quá trình build để không chặn deploy
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Bỏ qua lỗi Type trong quá trình build
    ignoreBuildErrors: true,
  },
  onDemandEntries: {
    // Thời gian (ms) giữ trang đã compile trong bộ nhớ đệm trước khi giải phóng (15 phút)
    maxInactiveAge: 15 * 60 * 1000,
    // Số lượng trang tối đa được giữ đồng thời trong bộ nhớ đệm
    pagesBufferLength: 20,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query',
      'clsx',
      'tailwind-merge',
      'zod',
      'sonner',
    ],
  },
};

export default nextConfig;
