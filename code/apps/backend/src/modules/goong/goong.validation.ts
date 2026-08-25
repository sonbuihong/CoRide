import { z } from 'zod';

const version = z.enum(['v1', 'v2']).default('v2');
const vehicle = z.enum(['car', 'bike', 'motorcycle', 'taxi', 'truck', 'hd']).default('car');
const coordinate = z.string().refine((value) => {
  const [latText, lngText, ...rest] = value.split(',').map((part) => part.trim());
  const lat = Number(latText);
  const lng = Number(lngText);
  return rest.length === 0 && Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}, 'Tọa độ phải có dạng lat,lng hợp lệ');

const coordinateList = (max: number, separator: '|' | ';') => z.string().refine((value) => {
  const entries = value.split(separator).filter(Boolean);
  return entries.length > 0 && entries.length <= max && entries.every((entry) => coordinate.safeParse(entry).success);
}, `Danh sách tọa độ không hợp lệ hoặc vượt quá ${max} điểm`);

export const autocompleteQuerySchema = z.object({
  query: z.string().trim().min(2).max(200),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  location: coordinate.optional(),
  radius: z.coerce.number().positive().max(500).optional(),
  more_compound: z.enum(['true', 'false']).default('true'),
  version,
  session_token: z.string().uuid().optional(),
});

export const placeDetailQuerySchema = z.object({
  place_id: z.string().trim().min(1).max(2048),
  version,
  session_token: z.string().uuid().optional(),
});

export const geocodeQuerySchema = z.object({
  address: z.string().trim().min(2).max(500),
  version,
});

export const reverseGeocodeQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  version,
});

export const directionsBodySchema = z.object({
  origin: coordinate,
  destination: coordinate,
  vehicle,
  alternatives: z.boolean().default(false),
  waypoints: z.array(coordinate).max(3, 'Chỉ hỗ trợ tối đa 3 điểm dừng').default([]),
});

export const distanceMatrixBodySchema = z.object({
  origins: coordinateList(25, '|'),
  destinations: coordinateList(25, '|'),
  vehicle,
});

export const tripBodySchema = z.object({
  origin: coordinate.optional(),
  destination: coordinate.optional(),
  waypoints: coordinateList(98, ';').optional(),
  vehicle,
  roundtrip: z.boolean().default(false),
}).superRefine((value, ctx) => {
  const count = Number(Boolean(value.origin)) + Number(Boolean(value.destination)) + (value.waypoints?.split(';').filter(Boolean).length ?? 0);
  if (count < 10) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Trip V2 yêu cầu tổng cộng ít nhất 10 tọa độ' });
  if (count > 100) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Trip V2 hỗ trợ tối đa 100 tọa độ' });
});

export const staticMapQuerySchema = z.object({
  origin: coordinate,
  destination: coordinate,
  width: z.coerce.number().int().min(160).max(1280).default(600),
  height: z.coerce.number().int().min(120).max(1280).default(400),
  vehicle,
  type: z.enum(['fastest', 'shortest']).default('fastest'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#0071E3'),
});

const cellTowerSchema = z.record(z.number());
const wifiSchema = z.object({
  macAddress: z.string().min(11).max(32),
  signalStrength: z.number().optional(),
  signalToNoiseRatio: z.number().optional(),
  age: z.number().nonnegative().optional(),
});

export const geolocationBodySchema = z.object({
  homeMobileCountryCode: z.number().int().optional(),
  homeMobileNetworkCode: z.number().int().optional(),
  radioType: z.enum(['gsm', 'cdma', 'wcdma', 'lte', 'nr']).optional(),
  carrier: z.string().max(100).optional(),
  considerIp: z.literal(false).default(false),
  cellTowers: z.array(cellTowerSchema).max(25).optional(),
  wifiAccessPoints: z.array(wifiSchema).max(25).optional(),
}).refine((value) => Boolean(value.cellTowers?.length || value.wifiAccessPoints?.length), {
  message: 'Cần cellTowers hoặc wifiAccessPoints; không định vị bằng IP backend',
});
