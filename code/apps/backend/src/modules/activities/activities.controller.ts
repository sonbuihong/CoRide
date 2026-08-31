import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError';
import {
  ACTIVITY_ROLES,
  ACTIVITY_SEGMENTS,
  ActivitiesService,
  type ActivityRole,
  type ActivitySegment,
} from './activities.service';

export async function listActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const role = req.query.role;
    const segment = req.query.segment;
    if (typeof role !== 'string' || !ACTIVITY_ROLES.includes(role as ActivityRole)) {
      throw new AppError('role phải là PASSENGER hoặc DRIVER', 400);
    }
    if (typeof segment !== 'string' || !ACTIVITY_SEGMENTS.includes(segment as ActivitySegment)) {
      throw new AppError('segment không hợp lệ', 400);
    }
    const rawLimit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 20;
    if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 50) {
      throw new AppError('limit phải là số nguyên từ 1 đến 50', 400);
    }
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const result = await ActivitiesService.list((req as any).user.id, role as ActivityRole, segment as ActivitySegment, cursor, rawLimit);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
