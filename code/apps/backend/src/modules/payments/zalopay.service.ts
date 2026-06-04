import axios from 'axios';
import CryptoJS from 'crypto-js';
import moment from 'moment';

export class ZaloPayService {
  private static config = {
    app_id: process.env.ZALOPAY_APP_ID || '',
    key1: process.env.ZALOPAY_KEY1 || '',
    key2: process.env.ZALOPAY_KEY2 || '',
    endpoint: process.env.ZALOPAY_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/create',
    callback_url: process.env.ZALOPAY_CALLBACK_URL || '',
  };

  /**
   * Tạo đơn hàng thanh toán qua ZaloPay
   * @param bookingId ID của booking
   * @param amount Số tiền (VNĐ)
   * @param description Mô tả giao dịch
   * @param userId ID người dùng thực hiện thanh toán
   */
  static async createOrder(bookingId: string, amount: number, description: string, userId: string) {
    const embed_data = JSON.stringify({
      booking_id: bookingId,
      redirecturl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/payment-result` : 'http://localhost:3000/payment-result',
    });

    const items = JSON.stringify([]);
    const transID = Math.floor(Math.random() * 1000000);
    const app_trans_id = `${moment().format('YYMMDD')}_${transID}`;

    const order = {
      app_id: this.config.app_id,
      app_trans_id,
      app_user: userId,
      app_time: Date.now(),
      item: items,
      embed_data: embed_data,
      amount: amount,
      description: description,
      bank_code: 'zalopayapp',
      callback_url: this.config.callback_url,
    };

    // app_id|app_trans_id|app_user|amount|app_time|embed_data|item
    const data = `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
    const mac = CryptoJS.HmacSHA256(data, this.config.key1).toString();

    const response = await axios.post(this.config.endpoint, {
      ...order,
      mac,
    });

    return {
      ...response.data,
      app_trans_id,
    };
  }

  /**
   * Xác thực chữ ký MAC từ Callback của ZaloPay
   * @param data Dữ liệu nhận được từ ZaloPay (dạng JSON string)
   * @param requestMac Mã MAC nhận được từ ZaloPay
   */
  static verifyCallback(data: string, requestMac: string): boolean {
    const mac = CryptoJS.HmacSHA256(data, this.config.key2).toString();
    return mac === requestMac;
  }
}
