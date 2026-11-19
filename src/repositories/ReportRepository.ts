import { prisma } from '../config/database';
import { ReportInput } from '../services/ReportService';

export async function listReportExams(): Promise<{ id: string; title: string }[]> {
  return prisma.exam.findMany({
    select: { id: true, title: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function loadReportExam(id: string): Promise<ReportInput | null> {
  return prisma.exam.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { versionLetter: 'asc' },
        include: {
          correcoes: {
            include: {
              student: { select: { name: true, registration: true } },
            },
          },
        },
      },
    },
  });
}
