/**
 * Re-export asyncHandler dùng chung từ shared/utils để tránh trùng lặp logic.
 * Giữ đường dẫn import cũ (`../middlewares/asyncHandler`) cho code legacy.
 */
export { asyncHandler } from '../shared/utils/asyncHandler';
