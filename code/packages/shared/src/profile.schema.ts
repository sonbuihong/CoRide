import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string({
    required_error: "Tên là bắt buộc",
  }).min(1, "Tên không được để trống"),
  lastName: z.string({
    required_error: "Họ là bắt buộc",
  }).min(1, "Họ không được để trống"),
  phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, "Số điện thoại Việt Nam không hợp lệ").optional().or(z.literal('')),
  bio: z.string().max(500, "Bio không được vượt quá 500 ký tự").optional().or(z.literal('')),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Schema xác thực tài xế (KYC) — dùng khi submit giấy tờ
export const driverVerificationSchema = z.object({
  licenseFrontImageUrl: z.string({
    required_error: "Ảnh bằng lái xe mặt trước là bắt buộc",
  }).url("Ảnh bằng lái xe mặt trước không hợp lệ"),
  licenseBackImageUrl: z.string({
    required_error: "Ảnh bằng lái xe mặt sau là bắt buộc",
  }).url("Ảnh bằng lái xe mặt sau không hợp lệ"),
  registrationFrontImageUrl: z.string({
    required_error: "Ảnh đăng ký xe mặt trước là bắt buộc",
  }).url("Ảnh đăng ký xe mặt trước không hợp lệ"),
  registrationBackImageUrl: z.string({
    required_error: "Ảnh đăng ký xe mặt sau là bắt buộc",
  }).url("Ảnh đăng ký xe mặt sau không hợp lệ"),
  vehiclePlate: z.string().min(5, "Biển số xe không hợp lệ").max(15, "Biển số xe quá dài"),
  vehicleModel: z.string({
    required_error: "Hãng xe là bắt buộc",
  }).min(1, "Vui lòng nhập Hãng xe (VD: Honda Wave, Toyota Vios)"),
  vehicleType: z.enum(['BIKE', 'CAR'], {
    errorMap: () => ({ message: "Loại phương tiện phải là Xe máy hoặc Ô tô" }),
  }),
});

export type DriverVerificationInput = z.infer<typeof driverVerificationSchema>;
