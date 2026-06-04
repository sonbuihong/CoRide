import multer from 'multer';

/**
 * Cấu hình multer upload.
 * Hiện tại dùng disk storage (lưu vào thư mục uploads/ cục bộ).
 *
 * TODO: Khi muốn dùng Cloudinary để lưu ảnh trên cloud, cài đặt package và
 * cấu hình CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 * trong .env, rồi thay thế storage bên dưới bằng CloudinaryStorage.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Đặt tên file: timestamp + tên gốc để tránh trùng lặp
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Tối đa 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp)'));
    }
  },
});

// Upload ảnh KYC: bất kỳ loại ảnh nào, không vượt quá 2MB
export const uploadKycImage = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // Tối đa 2MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận các tệp tin hình ảnh!'));
    }
  },
});
