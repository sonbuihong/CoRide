import type { CompletedBookingData } from '../booking/completed-booking';
import type { SimulatorQrData } from '../../services/payment.service';

export type PaymentState = {
  phase: 'IDLE' | 'LOADING_QR' | 'QR_READY' | 'CONFIRMING' | 'SUCCESS' | 'ERROR';
  qr?: SimulatorQrData;
  amount?: number;
  message?: string;
  retry?: 'LOAD' | 'CONFIRM' | 'RECONCILE';
};
export interface PaymentDependencies {
  readBooking: () => Promise<CompletedBookingData>;
  getQr: () => Promise<SimulatorQrData>;
  confirm: () => Promise<unknown>;
  onPaid: () => void;
}

const payable = (b: CompletedBookingData) => b.status === 'COMPLETED' && b.paymentStatus === 'UNPAID';

/** Framework-independent controller: synchronous lock protects taps before React rerenders. */
export class BookingPaymentMachine {
  private state: PaymentState = { phase: 'IDLE' };
  private listeners = new Set<() => void>();
  private busy = false;
  private generation = 0;
  constructor(private readonly deps: PaymentDependencies) {}
  snapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private publish(state: PaymentState) {
    this.state = state;
    this.listeners.forEach(listener => listener());
  }
  close = () => {
    if (this.state.phase === 'CONFIRMING') return;
    this.generation++;
    this.busy = false;
    this.publish({ phase: 'IDLE' });
  };
  private success(booking: CompletedBookingData) {
    this.publish({ phase: 'SUCCESS', amount: booking.totalPrice ?? undefined });
    this.deps.onPaid();
  }
  /** Only accepts snapshots fetched from the backend, never socket payment flags. */
  sync = (booking: CompletedBookingData) => {
    if (this.busy || this.state.phase === 'IDLE' || this.state.phase === 'SUCCESS') return;
    if (booking.paymentStatus === 'PAID') this.success(booking);
    else if (!payable(booking)) this.publish({ phase: 'ERROR', message: booking.paymentStatus === 'REFUNDED'
      ? 'Đặt chỗ đã được hoàn tiền. Không cần thanh toán lại.' : 'Đặt chỗ chưa sẵn sàng để thanh toán.' });
  };
  open = async () => {
    if (this.busy || this.state.phase === 'SUCCESS') return;
    this.busy = true;
    const generation = ++this.generation;
    this.publish({ phase: 'LOADING_QR' });
    try {
      const booking = await this.deps.readBooking();
      if (generation !== this.generation) return;
      if (booking.paymentStatus === 'PAID') { this.success(booking); return; }
      if (!payable(booking)) {
        this.publish({ phase: 'ERROR', message: booking.paymentStatus === 'REFUNDED'
          ? 'Đặt chỗ đã được hoàn tiền. Không cần thanh toán lại.' : 'Chỉ có thể thanh toán sau khi đặt chỗ hoàn thành.' });
        return;
      }
      const qr = await this.deps.getQr();
      if (generation !== this.generation) return;
      if (!qr || !Number.isFinite(qr.amount) || qr.amount < 0 || !qr.description || !/^https:\/\//.test(qr.qrUrl)) {
        throw new Error('INVALID_QR');
      }
      if (qr.amount !== booking.totalPrice) {
        // Do not log QR/account details. Refresh both authoritative snapshots on explicit retry.
        console.warn('[BookingPayment] QR amount differs from booking total; confirmation blocked.');
        this.publish({ phase: 'ERROR', message: 'Số tiền thanh toán đã thay đổi hoặc chưa đồng bộ. Vui lòng tải lại mã QR.', retry: 'LOAD' });
        return;
      }
      this.publish({ phase: 'QR_READY', qr });
    } catch {
      if (generation !== this.generation) return;
      // Another device may have paid between the booking read and QR request.
      try {
        const booking = await this.deps.readBooking();
        if (generation !== this.generation) return;
        if (booking.paymentStatus === 'PAID') { this.success(booking); return; }
      } catch { /* Preserve context and offer an explicit QR retry. */ }
      if (generation === this.generation) this.publish({ phase: 'ERROR', message: 'Không thể tạo mã thanh toán. Vui lòng kiểm tra kết nối và thử lại.', retry: 'LOAD' });
    } finally {
      if (generation === this.generation) this.busy = false;
    }
  };
  confirm = async () => {
    if (this.busy || !this.state.qr || !['QR_READY', 'ERROR'].includes(this.state.phase)) return;
    const qr = this.state.qr;
    this.busy = true;
    this.publish({ phase: 'CONFIRMING', qr });
    try {
      // Always reconcile before retrying: a lost response must never cause an immediate second POST.
      const before = await this.deps.readBooking();
      if (before.paymentStatus === 'PAID') { this.success(before); return; }
      if (!payable(before)) {
        this.publish({ phase: 'ERROR', message: before.paymentStatus === 'REFUNDED'
          ? 'Đặt chỗ đã được hoàn tiền. Không cần thanh toán lại.' : 'Trạng thái đặt chỗ đã thay đổi. Vui lòng quay lại chuyến đi.' });
        return;
      }
      if (before.totalPrice !== qr.amount) {
        this.publish({ phase: 'ERROR', message: 'Số tiền đã thay đổi. Vui lòng lấy mã QR mới trước khi xác nhận.', retry: 'LOAD' });
        return;
      }
      try { await this.deps.confirm(); } catch { /* All failures, including 409 and timeout, reconcile below. */ }
      const after = await this.deps.readBooking();
      if (after.paymentStatus === 'PAID') this.success(after);
      else if (payable(after)) this.publish({ phase: 'ERROR', qr, message: 'Không thể xác nhận thanh toán. Vui lòng kiểm tra kết nối và thử lại.', retry: 'CONFIRM' });
      else this.publish({ phase: 'ERROR', message: 'Trạng thái thanh toán đã thay đổi. Vui lòng quay lại chuyến đi.' });
    } catch {
      this.publish({ phase: 'ERROR', qr, message: 'Chưa kiểm tra được kết quả thanh toán. Hãy kết nối mạng và kiểm tra lại trước khi thử thanh toán.', retry: 'RECONCILE' });
    } finally { this.busy = false; }
  };
  reconcile = async () => {
    if (this.busy) return;
    const qr = this.state.qr;
    this.busy = true;
    this.publish({ phase: 'CONFIRMING', qr });
    try {
      const booking = await this.deps.readBooking();
      if (booking.paymentStatus === 'PAID') this.success(booking);
      else if (payable(booking)) this.publish({ phase: 'ERROR', qr, message: 'Đặt chỗ chưa được thanh toán. Bạn có thể thử xác nhận lại.', retry: qr ? 'CONFIRM' : 'LOAD' });
      else this.publish({ phase: 'ERROR', message: 'Trạng thái đặt chỗ đã thay đổi. Vui lòng quay lại chuyến đi.' });
    } catch {
      this.publish({ phase: 'ERROR', qr, message: 'Chưa kiểm tra được kết quả thanh toán. Vui lòng kiểm tra kết nối.', retry: 'RECONCILE' });
    } finally { this.busy = false; }
  };
  retry = () => {
    if (this.state.retry === 'LOAD') return this.open();
    if (this.state.retry === 'CONFIRM') return this.confirm();
    if (this.state.retry === 'RECONCILE') return this.reconcile();
  };
}
