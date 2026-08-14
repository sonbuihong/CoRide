import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();
const TEST_MARKER = '[SEARCH_TEST_RIDE]';

const destinations = [
  { address: '1 Đường Ngọc Hồi, Phường Yên Sở, Thành Phố Hà Nội', lat: 20.9646, lng: 105.8422 },
  { address: 'Đường Giải Phóng, Phường Hoàng Mai, Thành Phố Hà Nội', lat: 20.9806, lng: 105.8414 },
  { address: '272 Đường Võ Chí Công, Phường Tây Hồ, Thành Phố Hà Nội', lat: 21.0777, lng: 105.7907 },
  { address: '78 Đường Giải Phóng, Phường Kim Liên, Thành Phố Hà Nội', lat: 21.0005, lng: 105.8410 },
  { address: 'Phố Ngô Gia Khảm, Phường Bồ Đề, Thành Phố Hà Nội', lat: 21.0403, lng: 105.8780 },
];

const origins = [
  { address: 'Hồ Hoàn Kiếm, Phường Hoàn Kiếm, Thành Phố Hà Nội', lat: 21.0287, lng: 105.8522 },
  { address: 'Đại học Quốc gia Hà Nội, 144 Xuân Thủy, Phường Cầu Giấy, Thành Phố Hà Nội', lat: 21.0377, lng: 105.7828 },
  { address: 'Bến xe Mỹ Đình, Đường Phạm Hùng, Phường Từ Liêm, Thành Phố Hà Nội', lat: 21.0281, lng: 105.7784 },
  { address: 'Royal City, 72A Nguyễn Trãi, Phường Thanh Xuân, Thành Phố Hà Nội', lat: 21.0027, lng: 105.8150 },
  { address: 'Times City, 458 Minh Khai, Phường Vĩnh Tuy, Thành Phố Hà Nội', lat: 20.9950, lng: 105.8683 },
];

const createTestPolyline = (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  bend: number
) => JSON.stringify({
  coordinates: [
    [origin.lng, origin.lat],
    [
      origin.lng + (destination.lng - origin.lng) * 0.33 + bend,
      origin.lat + (destination.lat - origin.lat) * 0.33,
    ],
    [
      origin.lng + (destination.lng - origin.lng) * 0.66 - bend,
      origin.lat + (destination.lat - origin.lat) * 0.66,
    ],
    [destination.lng, destination.lat],
  ],
});

async function main() {
  const driver = await prisma.user.upsert({
    where: { email: 'search-test-driver@coride.local' },
    update: { firstName: 'Tài xế', lastName: 'Thử nghiệm', isDriverVerified: true },
    create: {
      email: 'search-test-driver@coride.local',
      password: 'TEST_ACCOUNT_DISABLED',
      firstName: 'Tài xế',
      lastName: 'Thử nghiệm',
      phone: '0900000000',
      isDriverVerified: true,
      driverRating: 4.9,
      driverRatingCount: 48,
    },
  });

  await prisma.ride.deleteMany({
    where: { driverId: driver.id, description: { startsWith: TEST_MARKER } },
  });

  const now = Date.now();
  const rides = Array.from({ length: 15 }, (_, index) => {
    const origin = origins[index % origins.length];
    const destination = destinations[index % destinations.length];
    const departureTime = new Date(now + (30 + index * 45) * 60_000);

    return {
      driverId: driver.id,
      origin: origin.address,
      originLat: origin.lat,
      originLng: origin.lng,
      destination: destination.address,
      destinationLat: destination.lat,
      destinationLng: destination.lng,
      departureTime,
      availableSeats: 1 + (index % 4),
      pricePerSeat: 25_000 + (index % 5) * 5_000,
      status: 'SCHEDULED' as const,
      distance: 6 + (index % 8) * 1.7,
      duration: 20 + (index % 7) * 6,
      routePolyline: createTestPolyline(origin, destination, ((index % 3) - 1) * 0.002),
      allowSmoking: false,
      allowPets: index % 3 === 0,
      allowLuggage: true,
      description: `${TEST_MARKER} Chuyến thử tìm kiếm số ${index + 1}`,
    };
  });

  const result = await prisma.ride.createMany({ data: rides });
  const routeReadyCount = await prisma.ride.count({
    where: {
      driverId: driver.id,
      description: { startsWith: TEST_MARKER },
      routePolyline: { not: null },
    },
  });
  console.log(
    `Đã tạo ${result.count} chuyến đi thử nghiệm; ${routeReadyCount}/${result.count} chuyến có dữ liệu lộ trình.`
  );
}

main()
  .catch((error) => {
    console.error('Không thể seed chuyến đi thử nghiệm:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
