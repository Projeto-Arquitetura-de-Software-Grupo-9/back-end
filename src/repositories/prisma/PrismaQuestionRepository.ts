import { prisma } from '../../config/database';
import {
  AlternativeDTO,
  AlternativeLetter,
  CreateQuestionRequestDTO,
  DifficultyLevel,
  QuestionDTO,
  QuestionFilterDTO,
  QuestionType,
  UpdateQuestionRequestDTO,
} from '../../types/question.dto';
import { IQuestionRepository } from '../interfaces/IQuestionRepository';

export class PrismaQuestionRepository implements IQuestionRepository {
  private getGabaritoDisplay(letter: AlternativeLetter): string {
    const map: Record<AlternativeLetter, string> = {
      A: 'ID-1',
      B: 'ID-2',
      C: 'ID-3',
      D: 'ID-4',
      E: 'ID-5',
    };
    return map[letter] || `ID-${letter}`;
  }

  private mapToDTO(row: any): QuestionDTO {
    const correctLetter = (row.correctAlternative || 'A') as AlternativeLetter;
    const rawTags = Array.isArray(row.tags) ? row.tags : [];
    const alternatives: AlternativeDTO[] = (row.alternatives || []).map(
      (alt: any) => ({
        id: alt.id,
        letter: alt.letter as AlternativeLetter,
        text: alt.text,
        isCorrect: alt.isCorrect || alt.letter === correctLetter,
      })
    );

    return {
      id: row.id,
      teacherId: row.teacherId,
      code: row.code,
      type: (row.type || 'objetiva') as QuestionType,
      discipline: row.discipline,
      difficulty: row.difficulty as DifficultyLevel,
      topic: row.topic || undefined,
      tags: rawTags,
      statement: row.statement,
      alternatives,
      correctAlternative: correctLetter,
      gabaritoDisplay: this.getGabaritoDisplay(correctLetter),
      points: row.points,
      maxScore: row.maxScore ?? row.points,
      explanation: row.explanation || undefined,
      createdAt: row.createdAt.toISOString(),
      deletedAt: row.deletedAt ? row.deletedAt.toISOString() : undefined,
    };
  }

  async findAll(filters?: QuestionFilterDTO): Promise<QuestionDTO[]> {
    const rows = await prisma.question.findMany({
      where: { deletedAt: null },
      include: {
        alternatives: {
          orderBy: { letter: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let result = rows.map((r) => this.mapToDTO(r));

    if (filters?.difficulty && filters.difficulty !== 'Todas') {
      result = result.filter(
        (q) => q.difficulty.toLowerCase() === filters.difficulty!.toLowerCase()
      );
    }

    if (filters?.tag && filters.tag !== 'Todas') {
      const tagLower = filters.tag.toLowerCase();
      result = result.filter(
        (q) => q.tags && q.tags.some((t) => t.toLowerCase() === tagLower)
      );
    }

    if (filters?.discipline && filters.discipline !== 'Todas') {
      const discLower = filters.discipline.toLowerCase();
      result = result.filter((q) => q.discipline.toLowerCase() === discLower);
    }

    if (filters?.type && filters.type !== 'Todas') {
      result = result.filter((q) => q.type === filters.type);
    }

    if (filters?.search && filters.search.trim() !== '') {
      const query = filters.search.trim().toLowerCase();
      result = result.filter(
        (q) =>
          q.statement.toLowerCase().includes(query) ||
          q.code.toLowerCase().includes(query) ||
          (q.topic && q.topic.toLowerCase().includes(query)) ||
          q.discipline.toLowerCase().includes(query) ||
          (q.tags && q.tags.some((t) => t.toLowerCase().includes(query)))
      );
    }

    return result;
  }

  async findById(id: string): Promise<QuestionDTO | null> {
    const found = await prisma.question.findFirst({
      where: { id, deletedAt: null },
      include: {
        alternatives: {
          orderBy: { letter: 'asc' },
        },
      },
    });
    return found ? this.mapToDTO(found) : null;
  }

  async create(data: CreateQuestionRequestDTO): Promise<QuestionDTO> {
    const randomNum = Math.floor(1036 + Math.random() * 900);
    const code = data.code?.trim() || `#Q-${randomNum}`;
    const type = data.type || 'objetiva';
    const correctAlternative: AlternativeLetter = data.correctAlternative || 'A';
    const tags =
      data.tags && data.tags.length > 0
        ? data.tags
        : [data.discipline.trim(), data.difficulty];

    const created = await prisma.question.create({
      data: {
        teacherId: data.teacherId || 'usr-prof-1',
        code,
        type,
        discipline: data.discipline.trim(),
        difficulty: data.difficulty,
        topic: data.topic?.trim() || 'Geral',
        tags,
        statement: data.statement.trim(),
        correctAlternative,
        points: data.points !== undefined ? Number(data.points) : 1.0,
        maxScore:
          data.maxScore !== undefined
            ? Number(data.maxScore)
            : data.points || 1.0,
        explanation: data.explanation?.trim() || null,
        alternatives:
          type === 'discursiva'
            ? undefined
            : {
                create: (data.alternatives || []).map((alt) => ({
                  letter: alt.letter,
                  text: alt.text.trim(),
                  isCorrect: alt.letter === correctAlternative,
                })),
              },
      },
      include: {
        alternatives: {
          orderBy: { letter: 'asc' },
        },
      },
    });

    return this.mapToDTO(created);
  }

  async update(
    id: string,
    data: UpdateQuestionRequestDTO
  ): Promise<QuestionDTO | null> {
    const existing = await prisma.question.findFirst({
      where: { id, deletedAt: null },
      include: { alternatives: true },
    });
    if (!existing) return null;

    const type = data.type !== undefined ? data.type : existing.type;
    const correctAlternative = (data.correctAlternative !== undefined
      ? data.correctAlternative
      : existing.correctAlternative) as AlternativeLetter;

    if (data.alternatives !== undefined || type === 'discursiva') {
      await prisma.alternative.deleteMany({ where: { questionId: id } });
    }

    const updated = await prisma.question.update({
      where: { id },
      data: {
        code: data.code !== undefined ? data.code.trim() : undefined,
        type,
        discipline:
          data.discipline !== undefined ? data.discipline.trim() : undefined,
        difficulty: data.difficulty !== undefined ? data.difficulty : undefined,
        topic: data.topic !== undefined ? data.topic.trim() : undefined,
        tags: data.tags !== undefined ? data.tags : undefined,
        statement:
          data.statement !== undefined ? data.statement.trim() : undefined,
        correctAlternative,
        points:
          data.points !== undefined ? Number(data.points) : undefined,
        maxScore:
          data.maxScore !== undefined ? Number(data.maxScore) : undefined,
        explanation:
          data.explanation !== undefined
            ? data.explanation.trim()
            : undefined,
        alternatives:
          type === 'discursiva'
            ? undefined
            : data.alternatives !== undefined
            ? {
                create: data.alternatives.map((alt) => ({
                  letter: alt.letter,
                  text: alt.text.trim(),
                  isCorrect: alt.letter === correctAlternative,
                })),
              }
            : undefined,
      },
      include: {
        alternatives: {
          orderBy: { letter: 'asc' },
        },
      },
    });

    return this.mapToDTO(updated);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) return false;
    await prisma.question.delete({ where: { id } });
    return true;
  }

  async getAvailableTags(): Promise<string[]> {
    const rows = await prisma.question.findMany({
      where: { deletedAt: null },
      select: { tags: true },
    });
    const set = new Set<string>();
    rows.forEach((r) => {
      if (Array.isArray(r.tags)) {
        r.tags.forEach((t: any) => {
          if (typeof t === 'string' && t.trim()) set.add(t.trim());
        });
      }
    });
    return ['Todas', ...Array.from(set)];
  }

  async getAvailableDisciplines(): Promise<string[]> {
    const rows = await prisma.question.findMany({
      where: { deletedAt: null },
      select: { discipline: true },
      distinct: ['discipline'],
    });
    return ['Todas', ...rows.map((r) => r.discipline)];
  }
}
