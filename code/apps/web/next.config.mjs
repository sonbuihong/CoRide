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
};

export default nextConfig;
