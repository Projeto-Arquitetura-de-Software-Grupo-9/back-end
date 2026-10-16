import { prisma } from '../../config/database';
import {
  ExamVariationResultDTO,
  VariationQuestionDTO,
} from '../../types/examVariation.dto';
import { IExamVariationRepository } from '../interfaces/IExamVariationRepository';

export class PrismaExamVariationRepository implements IExamVariationRepository {
  async getBaseQuestions(_examId: string): Promise<VariationQuestionDTO[]> {
    const questions = await prisma.question.findMany({
      where: { deletedAt: null, type: 'objetiva' },
      include: { alternatives: { orderBy: { letter: 'asc' } } },
      take: 5,
      orderBy: { createdAt: 'asc' },
    });

    return questions.map((q, idx) => ({
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
    }));
  }

  async saveVariations(
    examId: string,
    result: ExamVariationResultDTO
  ): Promise<void> {
    const existingExam = await prisma.exam.findUnique({ where: { id: examId } });
    if (existingExam) {
      await prisma.exam.update({
        where: { id: examId },
        data: {
          variationsJson: result as any,
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
    return exam.variationsJson as unknown as ExamVariationResultDTO;
  }
}
