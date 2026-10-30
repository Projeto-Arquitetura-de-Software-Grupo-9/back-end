import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { IExamPdfService } from '../services/interfaces/IExamPdfService';
import { ExamVersionLetter, GenerateExamPdfRequestDTO } from '../types/examPdf.dto';
import { z } from 'zod';

const examDraftSchema = z.object({
  id: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1, 'Informe o título da prova.').max(180),
  subtitle: z.string().trim().max(180).optional(),
  institution: z.string().trim().min(1).max(180),
  department: z.string().trim().min(1).max(180),
  course: z.string().trim().min(1).max(180),
  discipline: z.string().trim().min(1).max(180),
  classGroup: z.string().trim().min(1).max(180),
  semester: z.string().trim().min(1).max(40),
  date: z.string().trim().min(1).max(40),
  duration: z.string().trim().min(1).max(80),
  instructions: z.union([z.string(), z.array(z.string())]).optional(),
  includeBoxNota: z.boolean().optional(),
  selectedQuestionIds: z.array(z.string().trim().min(1)).min(1, 'Selecione ao menos uma questão.').max(20).optional(),
  selectedQuestions: z.array(z.object({
    id: z.string().trim().min(1),
    statement: z.string().trim().min(1),
    discipline: z.string().trim().optional(),
    topic: z.string().trim().optional(),
    difficulty: z.string().trim().optional(),
    alternatives: z.array(z.object({
      id: z.string().trim().min(1),
      letter: z.enum(['A', 'B', 'C', 'D', 'E']),
      text: z.string(),
    })).min(2).max(5),
    correctAlternative: z.enum(['A', 'B', 'C', 'D', 'E']),
  }).passthrough()).max(20).optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleAlternatives: z.boolean().optional(),
  numberOfVersions: z.number().int().min(1).max(4).optional(),
  maxScore: z.number().positive().optional(),
  permutationStrategy: z.enum(['FISHER_YATES', 'CYCLIC_ROTATION']).optional(),
}).passthrough();

function normalizeInstructions(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.map((line) => line.trim()).filter(Boolean);
  return typeof value === 'string' ? value.split('\n').map((line) => line.trim()).filter(Boolean) : [];
}

async function validateSelectedQuestions(ids: string[] | undefined): Promise<string[] | undefined> {
  if (!ids) return undefined;
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length !== ids.length) throw new Error('A prova não pode conter questões repetidas.');
  const questions = await prisma.question.findMany({
    where: { id: { in: uniqueIds }, deletedAt: null },
    select: { id: true, type: true, alternatives: { select: { id: true } } },
  });
  if (questions.length !== uniqueIds.length) throw new Error('Uma ou mais questões não existem ou foram removidas.');
  if (questions.some((question) => question.type !== 'objetiva' || question.alternatives.length < 2)) {
    throw new Error('A geração de cadernos aceita questões objetivas com pelo menos duas alternativas.');
  }
  return uniqueIds;
}

function validateQuestionSnapshot(ids: string[] | undefined, questions: z.infer<typeof examDraftSchema>['selectedQuestions']) {
  if (!questions) return;
  if (!ids || questions.length !== ids.length || questions.some((question, index) => question.id !== ids[index])) {
    throw new Error('As questões enviadas não correspondem à seleção da prova.');
  }
  if (questions.some((question) => !question.alternatives.some((alternative) => alternative.letter === question.correctAlternative))) {
    throw new Error('Cada questão precisa ter a alternativa correta entre as opções enviadas.');
  }
}

function examConfiguration(body: Partial<z.infer<typeof examDraftSchema>>, existing?: unknown) {
  const previous = existing && typeof existing === 'object' && !Array.isArray(existing)
    ? (existing as Record<string, unknown>)
    : {};
  return {
    ...previous,
    selectedQuestionIds: body.selectedQuestionIds ?? previous.selectedQuestionIds ?? [],
    selectedQuestions: body.selectedQuestions ?? previous.selectedQuestions ?? [],
    shuffleQuestions: body.shuffleQuestions ?? previous.shuffleQuestions ?? true,
    shuffleAlternatives: body.shuffleAlternatives ?? previous.shuffleAlternatives ?? true,
    numberOfVersions: body.numberOfVersions ?? previous.numberOfVersions ?? 4,
    maxScore: body.maxScore ?? previous.maxScore ?? 10,
    permutationStrategy: body.permutationStrategy ?? previous.permutationStrategy ?? 'FISHER_YATES',
  };
}

/**
 * Resolve a disciplina existente selecionada na criação/edição da prova.
 * Retorna null quando nenhum id foi informado (modo texto livre legado).
 * Lança erro com status HTTP quando o id é inválido/inexistente.
 */
async function resolveDisciplina(disciplinaId: unknown) {
  if (disciplinaId === undefined || disciplinaId === null || disciplinaId === '') return null;
  if (typeof disciplinaId !== 'string') {
    throw Object.assign(new Error('disciplinaId inválido.'), { status: 400 });
  }
  const disciplina = await prisma.disciplina.findUnique({ where: { id: disciplinaId } });
  if (!disciplina) {
    throw Object.assign(new Error('Disciplina selecionada não existe.'), { status: 404 });
  }
  return disciplina;
}

export class ExamController {
  constructor(private readonly examPdfService: IExamPdfService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const disciplinaId = req.query.disciplinaId as string | undefined;
      const exams = await prisma.exam.findMany({
        where: disciplinaId ? { disciplinaId } : undefined,
        include: { versions: true, disciplinaRef: true },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({
        success: true,
        count: exams.length,
        data: exams,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao listar provas.',
      });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const exam = await prisma.exam.findUnique({
        where: { id },
        include: { versions: true, disciplinaRef: true },
      });
      if (!exam) {
        res.status(404).json({ success: false, error: 'Prova não encontrada.' });
        return;
      }
      res.status(200).json({ success: true, data: exam });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao buscar prova.',
      });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = examDraftSchema.safeParse(req.body || {});
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.issues[0]?.message || 'Dados da prova inválidos.' });
        return;
      }
      const body = parsed.data;
      validateQuestionSnapshot(body.selectedQuestionIds, body.selectedQuestions);
      const selectedQuestionIds = body.selectedQuestions
        ? body.selectedQuestionIds
        : await validateSelectedQuestions(body.selectedQuestionIds);

      const disciplina = await resolveDisciplina(body.disciplinaId);

      const created = await prisma.exam.create({
        data: {
          id: body.id || undefined,
          code: body.code || `#PROVA-${Date.now().toString().slice(-4)}`,
          title: body.title || 'Avaliação Oficial',
          subtitle: body.subtitle || `Período Letivo ${body.semester || '2026.1'}`,
          institution: body.institution || 'CATÓLICA DE SANTA CATARINA',
          department: body.department || 'Curso de Direito',
          course: disciplina?.curso || body.course || 'Direito',
          discipline: disciplina?.nome || body.discipline || 'Direito Constitucional',
          disciplinaId: disciplina?.id ?? null,
          classGroup: body.classGroup || 'Turma A',
          semester: body.semester || '2026.1',
          date: body.date || new Date().toLocaleDateString('pt-BR'),
          duration: body.duration || '2 horas',
          instructions: normalizeInstructions(body.instructions),
          includeBoxNota: body.includeBoxNota ?? true,
          variationsJson: examConfiguration({ ...body, selectedQuestionIds }),
        },
        include: { versions: true, disciplinaRef: true },
      });

      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (err: any) {
      res.status(err.status || 400).json({
        success: false,
        error: err.message || 'Erro ao criar prova.',
      });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const parsed = examDraftSchema.partial().safeParse(req.body || {});
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.issues[0]?.message || 'Dados da prova inválidos.' });
        return;
      }
      const body = parsed.data;
      const existing = await prisma.exam.findUnique({ where: { id }, select: { variationsJson: true } });
      if (!existing) {
        res.status(404).json({ success: false, error: 'Prova não encontrada.' });
        return;
      }
      validateQuestionSnapshot(body.selectedQuestionIds, body.selectedQuestions);
      const selectedQuestionIds = body.selectedQuestions
        ? body.selectedQuestionIds
        : await validateSelectedQuestions(body.selectedQuestionIds);

      // disciplinaId: undefined = não altera; null/'' = desvincula; id = vincula
      const unlink = body.disciplinaId === null || body.disciplinaId === '';
      const disciplina = unlink ? null : await resolveDisciplina(body.disciplinaId);

      const updated = await prisma.exam.update({
        where: { id },
        data: {
          code: body.code !== undefined ? body.code : undefined,
          title: body.title !== undefined ? body.title : undefined,
          subtitle: body.subtitle !== undefined ? body.subtitle : undefined,
          institution: body.institution !== undefined ? body.institution : undefined,
          department: body.department !== undefined ? body.department : undefined,
          course: disciplina ? disciplina.curso : body.course !== undefined ? body.course : undefined,
          discipline: disciplina ? disciplina.nome : body.discipline !== undefined ? body.discipline : undefined,
          disciplinaId: disciplina ? disciplina.id : unlink ? null : undefined,
          classGroup: body.classGroup !== undefined ? body.classGroup : undefined,
          semester: body.semester !== undefined ? body.semester : undefined,
          date: body.date !== undefined ? body.date : undefined,
          duration: body.duration !== undefined ? body.duration : undefined,
          instructions: body.instructions !== undefined ? normalizeInstructions(body.instructions) : undefined,
          includeBoxNota: body.includeBoxNota !== undefined ? Boolean(body.includeBoxNota) : undefined,
          variationsJson: examConfiguration({ ...body, selectedQuestionIds }, existing.variationsJson),
        },
        include: { versions: true, disciplinaRef: true },
      });

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err: any) {
      res.status(err.status || 400).json({
        success: false,
        error: err.message || 'Erro ao atualizar prova.',
      });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await prisma.exam.delete({ where: { id } });
      res.status(200).json({
        success: true,
        message: 'Prova excluída com sucesso.',
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Erro ao excluir prova.',
      });
    }
  };

  getLayout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const versionLetter = (req.query.versionLetter as ExamVersionLetter) || 'A';

      const layout = await this.examPdfService.getExamLayout(id, versionLetter);

      res.status(200).json({
        success: true,
        data: layout,
      });
    } catch (err: any) {
      res.status(err.message?.includes('not found') ? 404 : 500).json({
        success: false,
        error: err.message || 'Erro ao carregar layout da prova.',
      });
    }
  };

  generatePdf = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { versionLetter, showAnswerKey, showQrCode, includeBoxNota } = req.body;

      const request: GenerateExamPdfRequestDTO = {
        examId: id,
        versionLetter: (versionLetter as ExamVersionLetter) || 'A',
        showAnswerKey: Boolean(showAnswerKey),
        showQrCode: showQrCode !== undefined ? Boolean(showQrCode) : true,
        includeBoxNota: includeBoxNota !== undefined ? Boolean(includeBoxNota) : false,
      };

      const result = await this.examPdfService.generateExamPdf(request);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao gerar PDF da prova.',
      });
    }
  };

  downloadPdf = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const versionLetter = (req.query.versionLetter as ExamVersionLetter) || 'A';
      const showAnswerKey = req.query.showAnswerKey === 'true';
      const showQrCode = req.query.showQrCode !== 'false';
      const includeBoxNota = req.query.includeBoxNota === 'true';
      const isDuplex = req.query.isDuplex !== 'false';
      const includeAnswerSheet = req.query.includeAnswerSheet !== 'false';

      const request: GenerateExamPdfRequestDTO = {
        examId: id,
        versionLetter,
        showAnswerKey,
        showQrCode,
        includeBoxNota,
        isDuplex,
        includeAnswerSheet,
      };

      const pdfBuffer = await this.examPdfService.generatePdfBuffer(request);
      const layout = await this.examPdfService.getExamLayout(id, versionLetter);
      const safeCode = layout.header.code.replace(/[^a-zA-Z0-9]/g, '');
      const filename = `Prova-${safeCode}-Caderno-${versionLetter}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', String(pdfBuffer.length));
      res.send(pdfBuffer);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro no download do PDF da avaliação.',
      });
    }
  };
}