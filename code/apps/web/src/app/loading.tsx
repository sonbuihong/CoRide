import React from 'react';

export default function RootLoading() {
  return (
    <div
      role="status"
      aria-label="Đang tải dữ liệu"
      className="flex min-h-[65vh] w-full flex-col items-center justify-center py-12"
    >
      <div className="relative flex items-center justify-center">
        {/* Vòng xoay spinner viền chính */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-600 dark:border-emerald-400/20 dark:border-t-emerald-400" />
        {/* Điểm nhấn ở tâm vòng */}
        <div className="absolute h-3 w-3 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
      </div>

      <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">
        Đang tải trang...
      </p>
    </div>
  );
}
