import { Request, Response } from 'express';
import { IQrCodeService } from '../services/interfaces/IQrCodeService';
import { GenerateQrCodeDTO, ValidateQrCodeInputDTO } from '../types/qrCode.dto';

export class QrCodeController {
  constructor(private readonly qrCodeService: IQrCodeService) {}

  generate = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        applicationId,
        examVersionId,
        versionLetter,
        examCode,
        studentId,
        studentRegistration,
        studentName,
        format,
        size,
      } = req.body;

      if (!applicationId || !examVersionId || !versionLetter || !examCode) {
        res.status(400).json({
          success: false,
          error: 'Parâmetros obrigatórios ausentes: applicationId, examVersionId, versionLetter, examCode.',
        });
        return;
      }

      const dto: GenerateQrCodeDTO = {
        applicationId,
        examVersionId,
        versionLetter,
        examCode,
        studentId,
        studentRegistration,
        studentName,
        format,
        size: size ? Number(size) : undefined,
      };

      const result = await this.qrCodeService.generateExamQrCode(dto);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro interno ao gerar QR Code.',
      });
    }
  };

  getByVersion = async (req: Request, res: Response): Promise<void> => {
    try {
      const { versionId } = req.params;
      const { studentId } = req.query;

      const result = await this.qrCodeService.getQrCodeByVersion(
        versionId,
        typeof studentId === 'string' ? studentId : undefined
      );

      if (!result) {
        res.status(404).json({
          success: false,
          error: `Nenhum QR Code registrado para a versão '${versionId}'.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao consultar QR Code da versão.',
      });
    }
  };

  validate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { qrCodePayload } = req.body;

      if (!qrCodePayload) {
        res.status(400).json({
          success: false,
          error: 'Campo "qrCodePayload" é obrigatório para validação.',
        });
        return;
      }

      const dto: ValidateQrCodeInputDTO = { qrCodePayload };
      const validation = await this.qrCodeService.validatePayload(dto);

      res.status(validation.isValid ? 200 : 422).json({
        success: validation.isValid,
        data: validation,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao validar payload de QR Code.',
      });
    }
  };
}
