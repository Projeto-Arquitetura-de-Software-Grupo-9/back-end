import { Request, Response } from 'express';
import { IExamPdfService } from '../services/interfaces/IExamPdfService';
import { IExamVariationService } from '../services/interfaces/IExamVariationService';
import { ExamVersionLetter } from '../types/examPdf.dto';

const VERSION_LETTERS: ExamVersionLetter[] = ['A', 'B', 'C', 'D'];

function parseVersion(raw: unknown): ExamVersionLetter | null {
  if (raw === undefined || raw === null || raw === '') return 'A';
  const v = String(raw).trim().toUpperCase();
  return (VERSION_LETTERS as string[]).includes(v) ? (v as ExamVersionLetter) : null;
}

/**
 * Back-end da página "Folha de Respostas":
 *  - GET /exams/:id/answer-sheet      → dados para montar a página (versões, nº de questões…)
 *  - GET /exams/:id/answer-sheet/pdf  → PDF somente com o cartão-resposta de um caderno
 */
export class AnswerSheetController {
  constructor(
    private readonly examPdfService: IExamPdfService,
    private readonly variationService: IExamVariationService
  ) {}

  /** Cadernos disponíveis: os já gerados em "Criar provas diferentes"; se nenhum, A–D. */
  private async resolveVersions(examId: string) {
    const variations = await this.variationService.getVariations(examId);
    const generated = variations ? variations.versions.map((v) => v.versionLetter) : [];
    return {
      variationsGenerated: generated.length > 0,
      availableVersions: generated.length > 0 ? generated : VERSION_LETTERS,
    };
  }

  get = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const versionLetter = parseVersion(req.query.versionLetter);
      if (!versionLetter) {
        res.status(400).json({ success: false, error: 'versionLetter deve ser A, B, C ou D.' });
        return;
      }

      const layout = await this.examPdfService.getExamLayout(id, versionLetter);
      const { variationsGenerated, availableVersions } = await this.resolveVersions(id);
      if (!availableVersions.includes(versionLetter)) {
        res.status(404).json({
          success: false,
          error: `Caderno ${versionLetter} não existe para esta prova. Disponíveis: ${availableVersions.join(', ')}.`,
        });
        return;
      }

      const includeAnswerKey = req.query.includeAnswerKey === 'true';

      res.status(200).json({
        success: true,
        data: {
          examId: id,
          examCode: layout.header.code,
          title: layout.header.title,
          institution: layout.header.institution,
          course: layout.header.course,
          discipline: layout.header.discipline,
          classGroup: layout.header.classGroup,
          semester: layout.header.semester,
          date: layout.header.date,
          selectedVersion: versionLetter,
          availableVersions,
          variationsGenerated,
          versionBubbles: VERSION_LETTERS,
          totalQuestions: Object.keys(layout.answerKey).length,
          alternativeLetters: ['A', 'B', 'C', 'D', 'E'],
          pdfUrl: `/api/v1/exams/${id}/answer-sheet/pdf?versionLetter=${versionLetter}`,
          ...(includeAnswerKey ? { answerKey: layout.answerKey } : {}),
        },
      });
    } catch (err: any) {
      res.status(err.message?.includes('not found') ? 404 : 500).json({
        success: false,
        error: err.message || 'Erro ao carregar a folha de respostas.',
      });
    }
  };

  pdf = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const versionLetter = parseVersion(req.query.versionLetter);
      if (!versionLetter) {
        res.status(400).json({ success: false, error: 'versionLetter deve ser A, B, C ou D.' });
        return;
      }

      const layout = await this.examPdfService.getExamLayout(id, versionLetter);
      const { availableVersions } = await this.resolveVersions(id);
      if (!availableVersions.includes(versionLetter)) {
        res.status(404).json({
          success: false,
          error: `Caderno ${versionLetter} não existe para esta prova. Disponíveis: ${availableVersions.join(', ')}.`,
        });
        return;
      }

      const buffer = await this.examPdfService.generatePdfBuffer({
        examId: id,
        versionLetter,
        showQrCode: req.query.showQrCode !== 'false',
        isDuplex: req.query.isDuplex === 'true',
        answerSheetOnly: true,
      });

      const safeCode = layout.header.code.replace(/[^a-zA-Z0-9]/g, '');
      const filename = `FolhaRespostas-${safeCode}-Caderno-${versionLetter}.pdf`;
      // ?inline=true permite pré-visualizar no navegador / iframe da página
      const disposition = req.query.inline === 'true' ? 'inline' : 'attachment';

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
      res.setHeader('Content-Length', String(buffer.length));
      res.send(buffer);
    } catch (err: any) {
      res.status(err.message?.includes('not found') ? 404 : 500).json({
        success: false,
        error: err.message || 'Erro ao gerar PDF da folha de respostas.',
      });
    }
  };
}
