import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string({
    required_error: "Email là bắt buộc",
  }).trim().toLowerCase().email("Email không hợp lệ"),
  password: z.string({
    required_error: "Mật khẩu là bắt buộc",
  }).min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: z.string().optional(),
  fullName: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, "Số điện thoại Việt Nam không hợp lệ").optional().or(z.literal('')),
}).refine((data) => {
  if (data.confirmPassword && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Mật khẩu không khớp",
  path: ["confirmPassword"],
}).refine((data) => {
  const hasFullName = Boolean(data.fullName && data.fullName.trim().length > 0);
  const hasFirstOrLastName = Boolean(
    (data.firstName && data.firstName.trim().length > 0) || 
    (data.lastName && data.lastName.trim().length > 0)
  );
  return hasFullName || hasFirstOrLastName;
}, {
  message: "Họ và tên không được để trống",
  path: ["fullName"],
});

export const registerFormSchema = z.object({
  fullName: z.string({
    required_error: "Họ và tên là bắt buộc",
  }).trim().min(2, "Vui lòng nhập đầy đủ họ và tên"),
  email: z.string({
    required_error: "Email là bắt buộc",
  }).trim().toLowerCase().email("Email không hợp lệ"),
  phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, "Số điện thoại Việt Nam không hợp lệ").optional().or(z.literal('')),
  password: z.string({
    required_error: "Mật khẩu là bắt buộc",
  }).min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: z.string({
    required_error: "Vui lòng nhập lại mật khẩu",
  }).min(1, "Vui lòng nhập lại mật khẩu"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ["confirmPassword"],
});

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const lastSpaceIndex = trimmed.lastIndexOf(' ');
  if (lastSpaceIndex === -1) {
    return { firstName: trimmed, lastName: '' };
  }
  return {
    lastName: trimmed.slice(0, lastSpaceIndex).trim(),
    firstName: trimmed.slice(lastSpaceIndex + 1).trim(),
  };
}

export const loginSchema = z.object({
  email: z.string({
    required_error: "Email là bắt buộc",
  }).trim().toLowerCase().email("Email không hợp lệ"),
  password: z.string({
    required_error: "Mật khẩu là bắt buộc",
  }).min(1, "Mật khẩu không được để trống"),
});

export const forgotPasswordSchema = z.object({
  email: z.string({
    required_error: "Email là bắt buộc",
  }).trim().toLowerCase().email("Email không hợp lệ"),
});

export const resetPasswordSchema = z.object({
  email: z.string(),
  otp: z.string().min(1, "Vui lòng nhập mã xác nhận"),
  newPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterFormInput = z.infer<typeof registerFormSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
