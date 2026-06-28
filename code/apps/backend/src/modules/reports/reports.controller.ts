import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service';

export const createReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reporterId = req.user!.id;
    const reportData = { ...req.body, reporterId };
    const report = await ReportsService.createReport(reportData);
    res.status(201).json({ message: 'Đã gửi báo cáo thành công', report });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
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
  } catch (error) {
    next(error);
  }
};

export const resolveReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Authorization: only ADMIN can resolve reports
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const report = await ReportsService.resolveReport(id as string, status as any);
    res.json({ message: 'Cập nhật báo cáo thành công', report });
  } catch (error) {
    next(error);
  }
};
