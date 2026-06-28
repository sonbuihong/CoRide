import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
const CloudinaryStorage = require('multer-storage-cloudinary').CloudinaryStorage || require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '123456789012345',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'secret'
});

// @ts-ignore
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: any, file: any) => {
    return {
      folder: 'coride/uploads',
      format: file.mimetype.split('/')[1], // giữ nguyên format
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`
    };
  },
}) as any;

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
