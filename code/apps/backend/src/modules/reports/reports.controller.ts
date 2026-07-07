import { Request, Response } from 'express';
import { ReportsService } from './reports.service';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const createReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const reporterId = req.user!.id;
  const reportData = { ...req.body, reporterId };
  const report = await ReportsService.createReport(reportData);
  res.status(201).json({ message: 'Đã gửi báo cáo thành công', report });
});

export const getReports = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { status, page, limit } = req.query;
  
  // Authorization: only ADMIN can get all reports
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const query = {
    status: status as any,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  };
  const result = await ReportsService.getReports(query);
  res.json(result);
});

export const resolveReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;
  
  // Authorization: only ADMIN can resolve reports
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const report = await ReportsService.resolveReport(id as string, status as any);
  res.json({ message: 'Cập nhật báo cáo thành công', report });
});
