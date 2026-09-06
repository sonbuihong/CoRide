import { BookingsService } from './src/modules/bookings/bookings.service';
import { extendedPrisma as prisma } from '@repo/database';

async function run() {
  try {
    const passengerId = '11111111-1111-1111-1111-111111111111'; // Dummy
    
    // Check if ride exists
    const rideId = 'dfb2771e-df68-4df4-b975-29c9da6c36bc';
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) {
      console.log('RIDE DOES NOT EXIST');
      return;
    }
    
    console.log('Testing createBooking...');
    const result = await BookingsService.createBooking(passengerId, {
      rideId,
      seats: 1,
      paymentMethod: 'CASH',
      passengerLat: 20.958661447433673,
      passengerLng: 105.74544935809189,
      dropoffLat: 20.995298399999985,
      dropoffLng: 105.9440907,
    });
    console.log('Success:', result);
  } catch (e: any) {
    console.error('ERROR OCCURRED:');
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
