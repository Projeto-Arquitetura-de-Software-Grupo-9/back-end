import { prisma } from '../config/database';
import { repositories, getActiveDataSource, createRepositories } from './index';
import { ReportInput } from '../services/ReportService';
const demoRepositories = repositories.source === 'mock' ? repositories : createRepositories('mock');

export async function listReportExams(): Promise<{ id: string; title: string }[]> {
  if (getActiveDataSource() === 'database') {
    return prisma.exam.findMany({ select: { id: true, title: true }, orderBy: { createdAt: 'desc' } });
  }
  const corrections = await demoRepositories.correcao.list();
  const ids = [...new Set(corrections.map(c => c.versaoProva?.examId).filter((id): id is string => Boolean(id)))];
  const exams = await Promise.all(ids.map(async id => ({ id, title: (await demoRepositories.examLayout.getExamHeader(id))?.title || id })));
  return exams;
}

export async function loadReportExam(id: string): Promise<ReportInput | null> {
  if (getActiveDataSource() === 'database') {
    return prisma.exam.findUnique({ where: { id }, include: { versions: {
      orderBy: { versionLetter: 'asc' }, include: { correcoes: { include: { student: { select: { name: true, registration: true } } } } },
    } } });
  }
  // Use the existing demonstration repositories, never invent a database result.
  const corrections = (await demoRepositories.correcao.list()).filter(c => c.versaoProva?.examId === id);
  if (!corrections.length) return null;
  const header = await demoRepositories.examLayout.getExamHeader(id);
  const versionIds = [...new Set(corrections.map(c => c.idVersaoProva))];
  const versions = await Promise.all(versionIds.map(async versionId => {
    const rows = corrections.filter(c => c.idVersaoProva === versionId);
    const versionLetter = rows[0].versaoProva!.versionLetter || 'A';
    const layout = await demoRepositories.examLayout.getExamLayout(id, versionLetter);
    return { id: versionId, versionLetter, answerKey: layout?.answerKey, correcoes: rows.map(c => ({ ...c, student: c.student || null })) };
  }));
  return { id, title: header?.title || id, versions };
}
