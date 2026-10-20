import { prisma } from '../../config/database';
import {
  ExamHeaderDTO,
  ExamLayoutDTO,
  ExamPageDTO,
  ExamQuestionLayoutDTO,
  ExamVersionLetter,
} from '../../types/examPdf.dto';
import { IExamRepository } from '../interfaces/IExamRepository';

export class PrismaExamRepository implements IExamRepository {
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
    versionLetter: ExamVersionLetter
  ): Promise<ExamQuestionLayoutDTO[]> {
    const version = await prisma.examVersion.findUnique({
      where: {
        examId_versionLetter: {
          examId: id,
          versionLetter,
        },
      },
    });

    if (version && Array.isArray(version.questionsLayout)) {
      return version.questionsLayout as unknown as ExamQuestionLayoutDTO[];
    }

    // Fallback to questions in DB if examVersion isn't found
    const dbQuestions = await prisma.question.findMany({
      where: { deletedAt: null, type: 'objetiva' },
      include: { alternatives: { orderBy: { letter: 'asc' } } },
      take: 5,
      orderBy: { createdAt: 'asc' },
    });

    return dbQuestions.map((q, idx) => ({
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
