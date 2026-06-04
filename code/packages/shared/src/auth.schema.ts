import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string({
    required_error: "Email là bắt buộc",
  }).email("Email không hợp lệ"),
  password: z.string({
    required_error: "Mật khẩu là bắt buộc",
  }).min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: z.string({
    required_error: "Vui lòng nhập lại mật khẩu",
  }),
  firstName: z.string({
    required_error: "Tên là bắt buộc",
  }).min(1, "Tên không được để trống"),
  lastName: z.string({
    required_error: "Họ là bắt buộc",
  }).min(1, "Họ không được để trống"),
  phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, "Số điện thoại Việt Nam không hợp lệ").optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string({
    required_error: "Email là bắt buộc",
  }).email("Email không hợp lệ"),
  password: z.string({
    required_error: "Mật khẩu là bắt buộc",
  }).min(1, "Mật khẩu không được để trống"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
