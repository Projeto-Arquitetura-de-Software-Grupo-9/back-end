import { Router } from 'express';
import { z } from 'zod';
import { ExamPdfService } from '../services/ExamPdfService';
import { ExamLayoutDTO } from '../types/examPdf.dto';

const text = z.string().max(2000);
const question = z.object({
  id: z.string().min(1), originalQuestionId: z.string().min(1), orderIndex: z.number().int().positive(),
  statement: z.string().min(1).max(20000), discipline: text.default(''),
  alternatives: z.array(z.object({ id: z.string(), letter: z.enum(['A','B','C','D','E']), text: z.string().max(10000) })).max(5),
  correctAlternative: z.enum(['A','B','C','D','E']), pointValue: z.number().nonnegative().optional(),
});
const requestSchema = z.object({
  examId: z.string().min(1).max(160), versionLetter: z.string().regex(/^[A-Z]$/),
  header: z.object({ institution: text, department: text, course: text, discipline: text, classGroup: text,
    semester: text, title: text, subtitle: text.optional(), code: text, date: text, duration: text,
    instructions: z.array(z.string().max(3000)).max(30), includeBoxNota: z.boolean(),
  }),
  pages: z.array(z.object({ questions: z.array(question).max(100) })).min(1).max(100),
  showAnswerKey: z.boolean().default(false), showQrCode: z.boolean().default(true),
  includeBoxNota: z.boolean().default(false), isDuplex: z.boolean().default(false), includeAnswerSheet: z.boolean().default(false),
}).refine(data => data.pages.reduce((n, page) => n + page.questions.length, 0) <= 100, 'Limite de 100 questões por exportação.');

/** Render the current preview without saving or generating exams/versions. */
export function createExamExportRouter() {
  const router = Router();
  router.post('/pdf', async (req, res) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: 'Prévia inválida para exportação PDF.', issues: parsed.error.flatten() }); return; }
    const input = parsed.data;
    const layout: ExamLayoutDTO = {
      examId: input.examId, title: input.header.title, versionLetter: input.versionLetter,
      pageSize: 'A4', dimensionsMm: { width: 210, height: 297 }, dimensionsPx: { width: 794, height: 1123 },
      marginsMm: { top: 15, bottom: 15, left: 15, right: 15 }, header: input.header,
      totalPages: input.pages.length,
      pages: input.pages.map((page, index) => ({ ...page, pageNumber: index + 1, totalPages: input.pages.length,
        versionLetter: input.versionLetter, isFirstPage: index === 0, header: index === 0 ? input.header : undefined })),
      qrCodePayload: JSON.stringify({ examId: input.examId, code: input.header.code, ver: input.versionLetter }),
      answerKey: Object.fromEntries(input.pages.flatMap(p => p.questions).map(q => [q.orderIndex, q.correctAlternative])),
    };
    const service = new ExamPdfService({
      getExamById: async () => layout, getExamLayout: async () => layout,
      getExamQuestions: async () => input.pages.flatMap(p => p.questions), getExamHeader: async () => input.header,
    });
    try {
      const buffer = await service.generatePdfBuffer(input);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="prova-caderno-${input.versionLetter}.pdf"`);
      res.send(buffer);
    } catch (error) {
      console.error('Falha na exportação da prévia:', error);
      res.status(500).json({ message: 'Não foi possível exportar a prévia da prova.' });
    }
  });
  return router;
}
