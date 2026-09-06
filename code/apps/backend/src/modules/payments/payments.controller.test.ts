const mockBooking = jest.fn();
const mockTransaction = jest.fn();
const mockEmit = jest.fn();
const mockWallet = jest.fn();
jest.mock('@repo/database', () => ({
  extendedPrisma: { tripRequest: { findUnique: jest.fn().mockResolvedValue(null) }, booking: { findUnique: mockBooking }, $transaction: mockTransaction },
  BookingStatus: { COMPLETED: 'COMPLETED' }, PaymentStatus: { UNPAID: 'UNPAID', PAID: 'PAID', REFUNDED: 'REFUNDED' },
  PaymentMethod: { QR: 'QR' }, TransactionType: { PAYMENT: 'PAYMENT' }, TransactionStatus: { SUCCESS: 'SUCCESS' }, TripStatus: {},
}));
jest.mock('./wallet.service', () => ({ WalletService: { getOrCreateWallet: mockWallet } }));
jest.mock('../../shared/lib/redis', () => ({ clearDriverBusy: jest.fn() }));
jest.mock('../trips/trip-realtime.service', () => ({ emitTripUpdated: jest.fn() }));
jest.mock('../../socket/socket.events', () => ({ SocketEventService: { emitToRooms: mockEmit } }));
import { PaymentsController } from './payments.controller';
import { Request, Response } from 'express';

const base = { id: 'booking-test', passengerId: 'passenger-test', rideId: 'ride-test', status: 'COMPLETED', paymentStatus: 'UNPAID', paymentMethod: null as string | null, totalPrice: 16000, ride: { driverId: 'driver-test' } };
function request(user = 'passenger-test') { return { user: { id: user }, params: { id: base.id }, body: { id: base.id, amount: 1, passengerId: 'ignored' } } as unknown as Request; }
function response() { return { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response; }

describe('Carpooling QR simulator contract', () => {
  let current: typeof base;
  let transactions: unknown[];
  let queue: Promise<void>;
  let failInsert: boolean;
  let update: jest.Mock;
  beforeEach(() => {
    jest.clearAllMocks(); current = { ...base }; transactions = []; queue = Promise.resolve(); failInsert = false;
    mockBooking.mockImplementation(async () => ({ ...current })); mockWallet.mockResolvedValue({ id: 'wallet-test' });
    update = jest.fn(async ({ where, data }) => {
      if (where.id !== current.id || where.passengerId !== current.passengerId || where.status !== current.status || where.paymentStatus !== current.paymentStatus) return { count: 0 };
      Object.assign(current, data); return { count: 1 };
    });
    // Serialized transactional mock models conditional claim + rollback, without touching user data.
    mockTransaction.mockImplementation(async operation => {
      const previous = queue; let release!: () => void; queue = new Promise<void>(resolve => { release = resolve; }); await previous;
      const snapshot = { ...current };
      try { return await operation({ booking: { updateMany: update }, transaction: { create: async ({ data }: { data: unknown }) => {
        if (failInsert) throw new Error('insert failed'); const row = { id: 'transaction-test', ...data as object }; transactions.push(row); return row;
      } } }); } catch (error) { current = snapshot; throw error; } finally { release(); }
    });
  });
  test('QR data uses backend amount/description and authorizes the passenger', async () => {
    const res = response(); const next = jest.fn(); await PaymentsController.getSimulatorQR(request(), res, next);
    expect(next).not.toHaveBeenCalled(); expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ amount: 16000, description: 'Thanh toan dat cho booking-', qrUrl: expect.stringContaining('amount=16000') }) }));
    await PaymentsController.getSimulatorQR(request('other'), response(), next); expect(next).toHaveBeenLastCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
  test.each(['PAID', 'REFUNDED'])('cannot get QR or confirm %s booking', async paymentStatus => {
    current.paymentStatus = paymentStatus; const next = jest.fn(); await PaymentsController.getSimulatorQR(request(), response(), next); await PaymentsController.confirmSimulatorPayment(request(), response(), next);
    expect(next).toHaveBeenCalledTimes(2); expect(mockTransaction).not.toHaveBeenCalled();
  });
  test('non-completed and unauthorized confirmations cannot claim payment', async () => {
    const next = jest.fn(); await PaymentsController.confirmSimulatorPayment(request('other'), response(), next); expect(next).toHaveBeenLastCalledWith(expect.objectContaining({ statusCode: 403 }));
    current.status = 'CONFIRMED'; await PaymentsController.confirmSimulatorPayment(request(), response(), next); expect(next).toHaveBeenLastCalledWith(expect.objectContaining({ statusCode: 400 })); expect(mockTransaction).not.toHaveBeenCalled();
  });
  test('atomic success saves PAID + QR and server amount, emits after transaction', async () => {
    const next = jest.fn(); await PaymentsController.confirmSimulatorPayment(request(), response(), next);
    expect(next).not.toHaveBeenCalled(); expect(current).toMatchObject({ paymentStatus: 'PAID', paymentMethod: 'QR' });
    expect(update).toHaveBeenCalledWith({ where: { id: base.id, passengerId: base.passengerId, status: 'COMPLETED', paymentStatus: 'UNPAID' }, data: { paymentStatus: 'PAID', paymentMethod: 'QR' } });
    expect(transactions).toEqual([expect.objectContaining({ amount: 16000, type: 'PAYMENT', status: 'SUCCESS', bookingId: base.id })]);
    expect(mockEmit).toHaveBeenCalledWith(expect.any(Array), 'payment:status_changed', expect.objectContaining({ bookingId: base.id, paymentStatus: 'PAID', paymentMethod: 'QR' }));
  });
  test('two concurrent devices can create only one transaction', async () => {
    const errors = [jest.fn(), jest.fn()]; await Promise.all(errors.map(next => PaymentsController.confirmSimulatorPayment(request(), response(), next)));
    expect(transactions).toHaveLength(1); expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(errors.flatMap(next => next.mock.calls)).toEqual([[expect.objectContaining({ code: 'PAYMENT_ALREADY_PROCESSED' })]]);
  });
  test('transaction insertion failure rolls booking status and method back, emits nothing', async () => {
    failInsert = true; const next = jest.fn(); await PaymentsController.confirmSimulatorPayment(request(), response(), next);
    expect(next).toHaveBeenCalled(); expect(current).toMatchObject({ paymentStatus: 'UNPAID', paymentMethod: null }); expect(transactions).toHaveLength(0); expect(mockEmit).not.toHaveBeenCalled();
  });
});
