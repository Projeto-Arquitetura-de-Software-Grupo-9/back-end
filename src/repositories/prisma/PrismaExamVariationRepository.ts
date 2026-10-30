import { prisma } from '../../config/database';
import {
  ExamVariationResultDTO,
  VariationQuestionDTO,
} from '../../types/examVariation.dto';
import { IExamVariationRepository } from '../interfaces/IExamVariationRepository';

export class PrismaExamVariationRepository implements IExamVariationRepository {
  async getBaseQuestions(examId: string): Promise<VariationQuestionDTO[]> {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { variationsJson: true },
    });
    const configuration = exam?.variationsJson && typeof exam.variationsJson === 'object'
      ? (exam.variationsJson as Record<string, unknown>)
      : {};
    const selectedIds = Array.isArray(configuration.selectedQuestionIds)
      ? configuration.selectedQuestionIds.filter((id): id is string => typeof id === 'string')
      : [];
    if (selectedIds.length === 0) return [];

    if (Array.isArray(configuration.selectedQuestions)) {
      const snapshots = new Map(
        (configuration.selectedQuestions as Array<Record<string, unknown>>)
          .filter((question) => typeof question.id === 'string')
          .map((question) => [question.id as string, question])
      );
      return selectedIds.flatMap((id, idx) => {
        const question = snapshots.get(id);
        if (!question || !Array.isArray(question.alternatives)) return [];
        return [{
          originalQuestionId: id,
          orderIndex: idx + 1,
          statement: String(question.statement || ''),
          discipline: typeof question.discipline === 'string' ? question.discipline : undefined,
          topic: typeof question.topic === 'string' ? question.topic : undefined,
          difficulty: typeof question.difficulty === 'string' ? question.difficulty : undefined,
          alternatives: question.alternatives as VariationQuestionDTO['alternatives'],
          correctAlternative: question.correctAlternative as VariationQuestionDTO['correctAlternative'],
        }];
      });
    }

    const questions = await prisma.question.findMany({
      where: { id: { in: selectedIds }, deletedAt: null, type: 'objetiva' },
      include: { alternatives: { orderBy: { letter: 'asc' } } },
    });
    const questionsById = new Map(questions.map((question) => [question.id, question]));

    return selectedIds.flatMap((id, idx) => {
      const q = questionsById.get(id);
      if (!q || q.alternatives.length < 2) return [];
      return [{
      originalQuestionId: q.id,
      orderIndex: idx + 1,
      statement: q.statement,
      discipline: q.discipline,
      topic: q.topic || 'Geral',
      difficulty: q.difficulty,
      alternatives: q.alternatives.map((a) => ({
        id: a.id,
        letter: a.letter as 'A' | 'B' | 'C' | 'D' | 'E',
        text: a.text,
      })),
      correctAlternative: q.correctAlternative as 'A' | 'B' | 'C' | 'D' | 'E',
      }];
    });
  }

  async saveVariations(
    examId: string,
    result: ExamVariationResultDTO
  ): Promise<void> {
    const existingExam = await prisma.exam.findUnique({ where: { id: examId } });
    if (existingExam) {
      const previous = existingExam.variationsJson && typeof existingExam.variationsJson === 'object'
        ? (existingExam.variationsJson as Record<string, unknown>)
        : {};
      await prisma.exam.update({
        where: { id: examId },
        data: {
          variationsJson: { ...previous, generatedVariations: result } as any,
        },
      });
    } else {
      await prisma.exam.create({
        data: {
          id: examId,
          code: `#PROVA-${examId}`,
          title: `Avaliação ${examId}`,
          subtitle: 'Semestre Letivo',
          institution: 'CATÓLICA DE SANTA CATARINA',
          department: 'Curso de Direito',
          course: 'Direito',
          discipline: 'Direito Constitucional',
          classGroup: 'Turma A',
          semester: '2026/1',
          date: new Date().toLocaleDateString('pt-BR'),
          duration: '2 horas',
          instructions: ['Marque apenas uma alternativa por questão.'],
          includeBoxNota: true,
          variationsJson: result as any,
        },
      });
    }

    for (const v of result.versions) {
      await prisma.examVersion.upsert({
        where: {
          examId_versionLetter: {
            examId,
            versionLetter: v.versionLetter,
          },
        },
        update: {
          questionsLayout: v.questions as any,
          answerKey: v.answerKey as any,
          qrCodePayload: JSON.stringify({
            examId,
            examCode: v.examCode,
            versionLetter: v.versionLetter,
          }),
        },
        create: {
          examId,
          versionLetter: v.versionLetter,
          questionsLayout: v.questions as any,
          answerKey: v.answerKey as any,
          qrCodePayload: JSON.stringify({
            examId,
            examCode: v.examCode,
            versionLetter: v.versionLetter,
          }),
        },
      });
    }
  }

  async getVariations(examId: string): Promise<ExamVariationResultDTO | null> {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam || !exam.variationsJson) return null;
    const stored = exam.variationsJson as Record<string, unknown>;
    const variations = stored.generatedVariations ?? stored;
    if (!variations || typeof variations !== 'object' || !('versions' in variations)) return null;
    return variations as unknown as ExamVariationResultDTO;
  }
}
