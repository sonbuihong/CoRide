import { z } from 'zod';

export const transactionStatusSchema = z.enum(['PENDING', 'SUCCESS', 'FAILED']);
export const transactionTypeSchema = z.enum(['DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'RECEIVE_PAYMENT', 'REFUND']);
export const paymentStatusSchema = z.enum(['UNPAID', 'PAID', 'REFUNDED']);

export const createTransactionSchema = z.object({
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  type: transactionTypeSchema,
  description: z.string().optional(),
  externalId: z.string().optional(),
  bookingId: z.string().optional(),
});

export const walletResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  balance: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const transactionResponseSchema = z.object({
  id: z.string(),
  walletId: z.string(),
  amount: z.number(),
  type: transactionTypeSchema,
  status: transactionStatusSchema,
  description: z.string().nullable(),
  externalId: z.string().nullable(),
  bookingId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type WalletResponse = z.infer<typeof walletResponseSchema>;
export type TransactionResponse = z.infer<typeof transactionResponseSchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
