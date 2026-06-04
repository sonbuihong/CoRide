import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Các route yêu cầu người dùng phải đăng nhập
const protectedRoutes = [
  '/admin',
  '/profile',
  '/my-rides',
  '/my-bookings',
  '/booking-requests',
  '/rides/post',
];

// Các route dành cho người chưa đăng nhập
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cookie refreshToken được set bởi backend (port 5001) với withCredentials: true.
  // Trình duyệt gửi cookie trong request tới backend, nhưng Next.js middleware
  // có thể nhận được cookie này khi trình duyệt forward nó trong navigation request
  // vì same-site (cùng localhost).
  const hasRefreshToken = request.cookies.has('refreshToken');

  // Kiểm tra xem route hiện tại có nằm trong danh sách protected không
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !hasRefreshToken) {
    // Client-side navigation (soft navigation) trong Next.js gửi header đặc biệt.
    // Trong trường hợp này, cookie có thể không được forward tới middleware.
    // → Cho qua và để auth-provider xử lý redirect ở client-side.
    const isClientNavigation = request.headers.has('next-url') ||
      request.headers.get('sec-fetch-dest') === 'empty';

    if (isClientNavigation) {
      return NextResponse.next();
    }

    // Hard navigation (gõ URL trực tiếp hoặc full page reload) mà không có cookie
    // → Redirect về login kèm callbackUrl
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Chỉ áp dụng middleware cho các page cụ thể để tránh chạy trên các file tĩnh, hình ảnh, api
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
