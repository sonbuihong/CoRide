import assert from 'node:assert/strict';
import test from 'node:test';
import { BookingPaymentMachine, type PaymentDependencies } from './booking-payment-machine';
import type { CompletedBookingData } from '../booking/completed-booking';

const fixture: CompletedBookingData = { id: 'booking-test', rideId: 'ride-test', passengerId: 'passenger-test', status: 'COMPLETED', paymentStatus: 'UNPAID', totalPrice: 16000, ride: { status: 'COMPLETED', driverId: 'driver-test' } };
const qr = { qrUrl: 'https://example.test/qr.png', amount: 16000, description: 'Backend description' };
function setup(overrides: Partial<PaymentDependencies> = {}) {
  let booking = { ...fixture };
  let posts = 0;
  let paidNotifications = 0;
  const deps: PaymentDependencies = {
    readBooking: async () => booking,
    getQr: async () => qr,
    confirm: async () => { posts++; booking = { ...booking, paymentStatus: 'PAID', paymentMethod: 'QR' }; },
    onPaid: () => { paidNotifications++; },
    ...overrides,
  };
  const machine = new BookingPaymentMachine(deps);
  return { machine, deps, posts: () => posts, paidNotifications: () => paidNotifications, setBooking: (b: CompletedBookingData) => { booking = b; } };
}
test('loads exact backend QR data and never marks paid just by opening QR', async () => {
  const { machine, posts } = setup(); await machine.open();
  assert.equal(machine.snapshot().phase, 'QR_READY'); assert.deepEqual(machine.snapshot().qr, qr); assert.equal(posts(), 0);
});
test('confirmation succeeds only after backend PAID and closes without a QR back stack', async () => {
  const s = setup(); await s.machine.open(); await s.machine.confirm();
  assert.equal(s.machine.snapshot().phase, 'SUCCESS'); assert.equal(s.posts(), 1); assert.equal(s.paidNotifications(), 1);
  s.machine.close(); assert.deepEqual(s.machine.snapshot(), { phase: 'IDLE' });
});
test('synchronous double-tap lock allows one confirmation and blocks close while processing', async () => {
  const s = setup(); await s.machine.open();
  const first = s.machine.confirm(); s.machine.close();
  assert.equal(s.machine.snapshot().phase, 'CONFIRMING');
  await Promise.all([first, s.machine.confirm(), s.machine.confirm()]); assert.equal(s.posts(), 1);
});
test('concurrent device wins: reconcile without another POST', async () => {
  const s = setup(); await s.machine.open(); s.setBooking({ ...fixture, paymentStatus: 'PAID' });
  await s.machine.confirm(); assert.equal(s.posts(), 0); assert.equal(s.machine.snapshot().phase, 'SUCCESS');
});
test('lost response after commit recovers to success', async () => {
  const s = setup(); s.deps.confirm = async () => { s.setBooking({ ...fixture, paymentStatus: 'PAID' }); throw new Error('timeout'); };
  await s.machine.open(); await s.machine.confirm(); assert.equal(s.machine.snapshot().phase, 'SUCCESS');
});
test('409 from concurrent confirmation reconciles to PAID', async () => {
  const s = setup(); s.deps.confirm = async () => { s.setBooking({ ...fixture, paymentStatus: 'PAID' }); throw { response: { status: 409, data: { code: 'PAYMENT_ALREADY_PROCESSED' } } }; };
  await s.machine.open(); await s.machine.confirm(); assert.equal(s.machine.snapshot().phase, 'SUCCESS');
});
test('real failure preserves QR, retry checks booking then confirms', async () => {
  const s = setup(); const original = s.deps.confirm; s.deps.confirm = async () => { throw new Error('offline'); };
  await s.machine.open(); await s.machine.confirm(); assert.equal(s.machine.snapshot().phase, 'ERROR'); assert.deepEqual(s.machine.snapshot().qr, qr);
  s.deps.confirm = original; await s.machine.retry(); assert.equal(s.machine.snapshot().phase, 'SUCCESS');
});
test('unknown result and failed reconciliation cannot immediately repeat POST', async () => {
  const s = setup(); await s.machine.open(); const read = s.deps.readBooking;
  s.deps.confirm = async () => { s.deps.readBooking = async () => { throw new Error('offline'); }; throw new Error('timeout'); };
  await s.machine.confirm(); assert.equal(s.machine.snapshot().retry, 'RECONCILE');
  let posts = 0; s.deps.confirm = async () => { posts++; };
  await s.machine.retry(); assert.equal(posts, 0);
  s.deps.readBooking = read; await s.machine.retry(); assert.equal(posts, 0); assert.equal(s.machine.snapshot().retry, 'CONFIRM');
});
test('already paid opens success without requesting QR', async () => {
  const s = setup({ getQr: async () => { throw new Error('must not call'); } }); s.setBooking({ ...fixture, paymentStatus: 'PAID' });
  await s.machine.open(); assert.equal(s.machine.snapshot().phase, 'SUCCESS');
});
test('refunded and individual drop-off without completed status cannot load QR', async () => {
  for (const booking of [{ ...fixture, paymentStatus: 'REFUNDED' }, { ...fixture, status: 'CONFIRMED', isDroppedOff: true }]) {
    let calls = 0; const s = setup({ getQr: async () => { calls++; return qr; } }); s.setBooking(booking);
    await s.machine.open(); assert.equal(calls, 0); assert.equal(s.machine.snapshot().phase, 'ERROR'); assert.equal(s.machine.snapshot().retry, undefined);
  }
});
test('amount mismatch prevents QR display and confirmation', async () => {
  const s = setup({ getQr: async () => ({ ...qr, amount: 17000 }) }); await s.machine.open(); await s.machine.confirm();
  assert.equal(s.machine.snapshot().phase, 'ERROR'); assert.equal(s.machine.snapshot().qr, undefined); assert.equal(s.posts(), 0);
});
test('QR request failure supports retry with booking context retained', async () => {
  const s = setup({ getQr: async () => { throw new Error('offline'); } }); await s.machine.open();
  assert.equal(s.machine.snapshot().retry, 'LOAD'); s.deps.getQr = async () => qr; await s.machine.retry(); assert.equal(s.machine.snapshot().phase, 'QR_READY');
});
test('late QR response after close cannot reopen the sheet', async () => {
  let resolve!: (value: typeof qr) => void;
  const s = setup({ getQr: () => new Promise(r => { resolve = r; }) }); const loading = s.machine.open();
  await Promise.resolve(); s.machine.close(); resolve(qr); await loading; assert.equal(s.machine.snapshot().phase, 'IDLE');
});
test('fresh socket-triggered snapshot marks an open QR successful, not an idle screen', async () => {
  const s = setup(); s.machine.sync({ ...fixture, paymentStatus: 'PAID' }); assert.equal(s.machine.snapshot().phase, 'IDLE');
  await s.machine.open(); s.machine.sync({ ...fixture, paymentStatus: 'PAID' }); assert.equal(s.machine.snapshot().phase, 'SUCCESS');
});
