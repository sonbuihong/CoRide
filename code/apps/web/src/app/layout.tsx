import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import 'maplibre-gl/dist/maplibre-gl.css';
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { Header } from "@/components/layout/header";
import { AuthProvider } from "@/components/providers/auth-provider";
import { RoleModeProvider } from "@/components/providers/role-mode-provider";
import { SocketProvider } from "@/components/providers/socket-provider";
import { BookingRequestPopup } from "@/components/booking/booking-request-popup";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "CoRide - Đi chung xe, Chia sẻ lộ trình",
  description:
    "Giải pháp đi chung xe an toàn và tiết kiệm cho sinh viên và nhân viên văn phòng.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={cn("font-sans", geistSans.variable)} suppressHydrationWarning>
      <body
        className={`${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <ReactQueryProvider>
          {/* AuthProvider bọc toàn bộ app để Header và mọi page đều có user context */}
          <AuthProvider>
            {/* RoleModeProvider — quản lý chế độ vai trò (Passenger/Driver) */}
            <RoleModeProvider>
              {/* SocketProvider nằm trong AuthProvider — cần token từ localStorage */}
              <SocketProvider>
                <Toaster position="top-center" richColors closeButton />
                {/* BookingRequestPopup luôn active toàn ứng dụng — tài xế nhận popup ngay khi có yêu cầu */}
                <BookingRequestPopup />
                <Header />
                <main className="pb-[80px] lg:pb-0">
                  {children}
                </main>
                <MobileBottomNav />
              </SocketProvider>
            </RoleModeProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
