"use client";

// maps-provider.tsx — FILE NÀY ĐÃ BỊ DEPRECATED.
// Thay bằng GoogleMapsProvider ở components/providers/google-maps-provider.tsx.
// Giữ lại để tránh lỗi import cũ, nhưng không dùng trực tiếp.

import { ReactNode } from "react";

interface MapsProviderProps {
  children: ReactNode;
}

export function MapsProvider({ children }: MapsProviderProps) {
  // Redirect sang GoogleMapsProvider đã được đặt ở layout.tsx toàn app
  return <>{children}</>;
}
