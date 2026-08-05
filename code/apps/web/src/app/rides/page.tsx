import type { Metadata } from 'next';
import RidesClient from './rides-client';

export const metadata: Metadata = {
  title: 'Tìm chuyến đi | CoRide',
  description: 'Tìm và đặt chỗ trên hàng ngàn chuyến đi thân thiện trên CoRide.',
};

// Server Component
export default function RidesPage() {
  return <RidesClient />;
}
