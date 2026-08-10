import type { Metadata } from 'next';
import SearchClient from './search-client';

export const metadata: Metadata = {
  title: 'Kết quả tìm kiếm | CoRide',
  description: 'Danh sách các chuyến đi phù hợp với bạn.',
};

export default function SearchPage() {
  return <SearchClient />;
}
