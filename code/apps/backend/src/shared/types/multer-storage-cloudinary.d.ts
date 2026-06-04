// Declaration cho multer-storage-cloudinary vì package không có built-in types
// Đủ để TypeScript không báo lỗi khi import
declare module 'multer-storage-cloudinary' {
  import { StorageEngine } from 'multer';
  import { v2 as CloudinaryType } from 'cloudinary';

  interface CloudinaryStorageOptions {
    cloudinary: typeof CloudinaryType;
    params?: Record<string, unknown> | ((req: unknown, file: unknown) => unknown);
  }

  class CloudinaryStorage implements StorageEngine {
    constructor(options: CloudinaryStorageOptions);
    _handleFile(
      req: unknown,
      file: unknown,
      callback: (error?: unknown, info?: unknown) => void
    ): void;
    _removeFile(
      req: unknown,
      file: unknown,
      callback: (error?: unknown) => void
    ): void;
  }

  export { CloudinaryStorage };
}
