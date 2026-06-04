import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { Header } from "@/components/layout/header";
import { AuthProvider } from "@/components/providers/auth-provider";
import { RoleModeProvider } from "@/components/providers/role-mode-provider";
import { SocketProvider } from "@/components/providers/socket-provider";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
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
    <html lang="vi" className={cn("font-sans", inter.variable)} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        {/* AuthProvider bọc toàn bộ app để Header và mọi page đều có user context */}
        <AuthProvider>
          {/* RoleModeProvider — quản lý chế độ vai trò (Passenger/Driver) */}
          <RoleModeProvider>
            {/* SocketProvider nằm trong AuthProvider — cần token từ localStorage */}
            <SocketProvider>
              <Toaster position="top-center" richColors />
              <Header />
              {children}
            </SocketProvider>
          </RoleModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
