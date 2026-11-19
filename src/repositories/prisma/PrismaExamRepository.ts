import { prisma } from '../../config/database';
import {
  ExamHeaderDTO,
  ExamLayoutDTO,
  ExamPageDTO,
  ExamQuestionLayoutDTO,
  ExamVersionLetter,
} from '../../types/examPdf.dto';
import {
  CreateExamDTO,
  ExamRecordDTO,
  IExamRepository,
  UpdateExamDTO,
} from '../interfaces/IExamRepository';

export class PrismaExamRepository implements IExamRepository {
  async listExams(disciplinaId?: string): Promise<ExamRecordDTO[]> {
    const exams = await prisma.exam.findMany({
      where: disciplinaId ? { disciplinaId } : undefined,
      include: { versions: true, disciplinaRef: true },
      orderBy: { createdAt: 'desc' },
    });
    return exams.map((exam) => ({
      ...exam,
      instructions: Array.isArray(exam.instructions) ? (exam.instructions as string[]) : [],
    })) as ExamRecordDTO[];
  }

  async findExamById(id: string): Promise<ExamRecordDTO | null> {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { versions: true, disciplinaRef: true },
    });
    if (!exam) return null;
    return {
      ...exam,
      instructions: Array.isArray(exam.instructions) ? (exam.instructions as string[]) : [],
    } as ExamRecordDTO;
  }

  private async syncVersionsFromConfig(examId: string, examCode: string, variationsJson: unknown): Promise<void> {
    if (!variationsJson || typeof variationsJson !== 'object' || Array.isArray(variationsJson)) return;
    const cfg = variationsJson as Record<string, any>;
    const versions = Array.isArray(cfg.versions) ? cfg.versions : [];
    for (const v of versions) {
      const versionLetter = String(v?.versionLetter || '').trim().toUpperCase();
      if (!/^[A-Z]$/.test(versionLetter)) continue;
      const questionsLayout = Array.isArray(v.questions) ? v.questions : [];
      const answerKey = v.answerKey && typeof v.answerKey === 'object' ? v.answerKey : {};
      const qrCodePayload =
        typeof v.qrCodePayload === 'string' && v.qrCodePayload
          ? v.qrCodePayload
          : JSON.stringify({ app: 'CORREGE', examId, code: examCode, ver: versionLetter });

      await prisma.examVersion.upsert({
        where: { examId_versionLetter: { examId, versionLetter } },
        update: { questionsLayout, answerKey, qrCodePayload },
        create: { examId, versionLetter, questionsLayout, answerKey, qrCodePayload },
      });
    }
  }

  async createExam(data: CreateExamDTO): Promise<ExamRecordDTO> {
    const created = await prisma.exam.create({
      data: {
        id: data.id || undefined,
        code: data.code || `#PROVA-${Date.now().toString().slice(-4)}`,
        title: data.title,
        subtitle: data.subtitle || '',
        institution: data.institution,
        department: data.department,
        course: data.course,
        discipline: data.discipline,
        disciplinaId: data.disciplinaId ?? null,
        classGroup: data.classGroup,
        semester: data.semester,
        date: data.date,
        duration: data.duration,
        instructions: data.instructions,
        includeBoxNota: data.includeBoxNota ?? false,
        variationsJson: data.variationsJson,
      },
      include: { versions: true, disciplinaRef: true },
    });
    await this.syncVersionsFromConfig(created.id, created.code, data.variationsJson);
    const refreshed = await prisma.exam.findUnique({
      where: { id: created.id },
      include: { versions: true, disciplinaRef: true },
    });
    const row = refreshed || created;
    return {
      ...row,
      instructions: Array.isArray(row.instructions) ? (row.instructions as string[]) : [],
    } as ExamRecordDTO;
  }

  async updateExam(id: string, data: UpdateExamDTO): Promise<ExamRecordDTO> {
    const updated = await prisma.exam.update({
      where: { id },
      data: {
        code: data.code !== undefined ? data.code : undefined,
        title: data.title !== undefined ? data.title : undefined,
        subtitle: data.subtitle !== undefined ? data.subtitle : undefined,
        institution: data.institution !== undefined ? data.institution : undefined,
        department: data.department !== undefined ? data.department : undefined,
        course: data.course !== undefined ? data.course : undefined,
        discipline: data.discipline !== undefined ? data.discipline : undefined,
        disciplinaId: data.disciplinaId !== undefined ? data.disciplinaId : undefined,
        classGroup: data.classGroup !== undefined ? data.classGroup : undefined,
        semester: data.semester !== undefined ? data.semester : undefined,
        date: data.date !== undefined ? data.date : undefined,
        duration: data.duration !== undefined ? data.duration : undefined,
        instructions: data.instructions !== undefined ? data.instructions : undefined,
        includeBoxNota: data.includeBoxNota !== undefined ? Boolean(data.includeBoxNota) : undefined,
        variationsJson: data.variationsJson !== undefined ? data.variationsJson : undefined,
      },
      include: { versions: true, disciplinaRef: true },
    });
    if (data.variationsJson !== undefined) {
      await this.syncVersionsFromConfig(updated.id, updated.code, data.variationsJson);
    }
    const refreshed = await prisma.exam.findUnique({
      where: { id: updated.id },
      include: { versions: true, disciplinaRef: true },
    });
    const row = refreshed || updated;
    return {
      ...row,
      instructions: Array.isArray(row.instructions) ? (row.instructions as string[]) : [],
    } as ExamRecordDTO;
  }

  async deleteExam(id: string): Promise<boolean> {
    await prisma.exam.delete({ where: { id } });
    return true;
  }

  async getExamById(id: string): Promise<ExamLayoutDTO | null> {
    return this.getExamLayout(id, 'A');
  }

  async getExamHeader(id: string): Promise<ExamHeaderDTO | null> {
    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) {
      return null;
    }

    return {
      institution: exam.institution,
      department: exam.department,
      course: exam.course,
      discipline: exam.discipline,
      classGroup: exam.classGroup,
      semester: exam.semester,
      title: exam.title,
      subtitle: exam.subtitle,
      code: exam.code,
      date: exam.date,
      duration: exam.duration,
      instructions: Array.isArray(exam.instructions)
        ? (exam.instructions as string[])
        : [],
      includeBoxNota: exam.includeBoxNota,
    };
  }

  async getExamQuestions(
    id: string,
    versionLetter: ExamVersionLetter = 'A'
  ): Promise<ExamQuestionLayoutDTO[]> {
    const version = await prisma.examVersion.findUnique({
      where: {
        examId_versionLetter: {
          examId: id,
          versionLetter,
        },
      },
    });

    if (version && Array.isArray(version.questionsLayout) && version.questionsLayout.length > 0) {
      return version.questionsLayout as unknown as ExamQuestionLayoutDTO[];
    }

    // Resolve strictly from this exam's own variationsJson (never grab random unrelated DB questions)
    const exam = await prisma.exam.findUnique({
      where: { id },
      select: { variationsJson: true },
    });
    const config =
      exam?.variationsJson && typeof exam.variationsJson === 'object' && !Array.isArray(exam.variationsJson)
        ? (exam.variationsJson as Record<string, unknown>)
        : {};

    if (Array.isArray(config.selectedQuestions) && config.selectedQuestions.length > 0) {
      return (config.selectedQuestions as Array<Record<string, any>>).map((q, idx) => ({
        id: String(q.id || `q-${idx + 1}`),
        originalQuestionId: String(q.originalQuestionId || q.id || `q-${idx + 1}`),
        orderIndex: Number(q.orderIndex) || idx + 1,
        statement: String(q.statement || ''),
        discipline: String(q.discipline || ''),
        alternatives: Array.isArray(q.alternatives)
          ? q.alternatives.map((a: any, aIdx: number) => ({
              id: String(a.id || `alt-${aIdx}`),
              letter: (a.letter || String.fromCharCode(65 + aIdx)) as 'A' | 'B' | 'C' | 'D' | 'E',
              text: String(a.text || ''),
            }))
          : [],
        correctAlternative: (q.correctAlternative || 'A') as 'A' | 'B' | 'C' | 'D' | 'E',
        pointValue: Number(q.points ?? q.pointValue ?? 1.0),
      }));
    }

    const selectedIds = Array.isArray(config.selectedQuestionIds)
      ? config.selectedQuestionIds.filter((qid): qid is string => typeof qid === 'string')
      : [];
    if (selectedIds.length === 0) {
      return [];
    }

    const dbQuestions = await prisma.question.findMany({
      where: { id: { in: selectedIds }, deletedAt: null },
      include: { alternatives: { orderBy: { letter: 'asc' } } },
    });
    const byId = new Map(dbQuestions.map((q) => [q.id, q]));

    return selectedIds
      .map((qid) => byId.get(qid))
      .filter((q): q is NonNullable<typeof q> => Boolean(q))
      .map((q, idx) => ({
        id: q.id,
        originalQuestionId: q.id,
        orderIndex: idx + 1,
        statement: q.statement,
        discipline: q.discipline,
        alternatives: q.alternatives.map((a) => ({
          id: a.id,
          letter: a.letter as 'A' | 'B' | 'C' | 'D' | 'E',
          text: a.text,
        })),
        correctAlternative: q.correctAlternative as 'A' | 'B' | 'C' | 'D' | 'E',
        pointValue: q.points,
      }));
  }

  async getExamLayout(
    id: string,
    versionLetter: ExamVersionLetter = 'A'
  ): Promise<ExamLayoutDTO | null> {
    const header = await this.getExamHeader(id);
    if (!header) return null;

    const questions = await this.getExamQuestions(id, versionLetter);
    const page1Questions = questions.slice(0, 3);
    const page2Questions = questions.slice(3);

    const pages: ExamPageDTO[] = [
      {
        pageNumber: 1,
        totalPages: 2,
        versionLetter,
        isFirstPage: true,
        header,
        questions: page1Questions,
      },
      {
        pageNumber: 2,
        totalPages: 2,
        versionLetter,
        isFirstPage: false,
        questions: page2Questions,
      },
    ];

    const answerKey: Record<number, 'A' | 'B' | 'C' | 'D' | 'E'> = {};
    questions.forEach((q) => {
      answerKey[q.orderIndex] = q.correctAlternative;
    });

    return {
      examId: id,
      title: header.title,
      versionLetter,
      pageSize: 'A4',
      dimensionsMm: { width: 210, height: 297 },
      dimensionsPx: { width: 794, height: 1123 },
      marginsMm: { top: 15, bottom: 15, left: 15, right: 15 },
      header,
      totalPages: 2,
      pages,
      qrCodePayload: JSON.stringify({
        appId: 'CORREGE',
        examCode: header.code,
        ver: versionLetter,
        pages: 2,
      }),
      answerKey,
    };
  }
}
