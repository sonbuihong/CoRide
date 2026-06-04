import { useState, useEffect } from 'react';

/**
 * Custom hook để debounce giá trị
 * @param value - Giá trị cần debounce
 * @param delay - Thời gian delay (ms), mặc định 500ms
 * @returns Giá trị đã được debounce
 */
function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timeout để cập nhật debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timeout khi value thay đổi hoặc component unmount
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
