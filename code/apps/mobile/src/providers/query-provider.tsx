import type { ComponentProps } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Tạo một instance duy nhất cho toàn bộ app
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Không retry nếu lỗi là 401 (Unauthorized) hoặc 400 (Bad Request / Validation)
        if (error?.status === 401 || error?.status === 400) {
          return false;
        }
        // Retry tối đa 2 lần cho các lỗi khác
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 2, // Dữ liệu cũ sau 2 phút
      refetchOnWindowFocus: true, // Khi app focus lại thì refetch
    },
  },
});

interface QueryProviderProps {
  children: ComponentProps<typeof QueryClientProvider>['children'];
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
