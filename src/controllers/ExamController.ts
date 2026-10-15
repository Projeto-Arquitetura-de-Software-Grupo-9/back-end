import { Request, Response } from 'express';
import { IExamPdfService } from '../services/interfaces/IExamPdfService';
import { ExamVersionLetter, GenerateExamPdfRequestDTO } from '../types/examPdf.dto';

export class ExamController {
  constructor(private readonly examPdfService: IExamPdfService) {}

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
        includeBoxNota: includeBoxNota !== undefined ? Boolean(includeBoxNota) : true,
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
      const includeBoxNota = req.query.includeBoxNota !== 'false';

      const request: GenerateExamPdfRequestDTO = {
        examId: id,
        versionLetter,
        showAnswerKey,
        showQrCode,
        includeBoxNota,
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
