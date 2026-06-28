import { extendedPrisma as prisma } from '@repo/database';
import { AppError } from '../../shared/errors/AppError';

interface CreateReportInput {
  reporterId: string;
  reportedId: string;
  rideId?: string;
  bookingId?: string;
  reason: string;
  description?: string;
}

export class ReportsService {
  static async createReport(data: CreateReportInput) {
    if (data.reporterId === data.reportedId) {
      throw new AppError('Bạn không thể báo cáo chính mình', 400);
    }

    const report = await prisma.report.create({
      data: {
        reporterId: data.reporterId,
        reportedId: data.reportedId,
        rideId: data.rideId,
        reason: data.reason,
        detail: data.description,
        status: 'PENDING',
      },
    });

    return report;
  }

  static async getReports(query: { status?: 'PENDING' | 'RESOLVED' | 'REJECTED', page?: number, limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause = query.status ? { status: query.status } : {};

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: whereClause,
        include: {
          reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
          reported: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.report.count({ where: whereClause })
    ]);

    return {
      reports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async resolveReport(reportId: string, status: 'RESOLVED' | 'REJECTED') {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      throw new AppError('Không tìm thấy báo cáo', 404);
    }

    return prisma.report.update({
      where: { id: reportId },
      data: {
        status,
      },
    });
  }
}
