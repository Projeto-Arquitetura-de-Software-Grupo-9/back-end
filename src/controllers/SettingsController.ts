import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ISettingsService } from '../services/interfaces/ISettingsService';
import { getJwtSecret } from '../middlewares/authMiddleware';

function resolveTeacherId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7).trim(), getJwtSecret()) as { id?: string };
      if (decoded?.id) return decoded.id;
    } catch {
      // ignore invalid token here, fall through to explicit teacherId
    }
  }
  const fromQuery = typeof req.query?.teacherId === 'string' ? req.query.teacherId.trim() : '';
  const fromBody = typeof req.body?.teacherId === 'string' ? req.body.teacherId.trim() : '';
  return fromQuery || fromBody || 'institutional-default';
}

export class SettingsController {
  constructor(private readonly settingsService: ISettingsService) {}

  getSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const teacherId = resolveTeacherId(req);
      const settings = await this.settingsService.getSettings(teacherId);

      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao carregar configurações do sistema.',
      });
    }
  };

  updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const teacherId = resolveTeacherId(req);
      const updated = await this.settingsService.updateSettings(
        teacherId,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'As preferências institucionais da Católica SC foram atualizadas.',
        data: updated,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Erro ao salvar configurações do sistema.',
      });
    }
  };

  resetSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const teacherId = resolveTeacherId(req);
      const reset = await this.settingsService.resetSettings(teacherId);

      res.status(200).json({
        success: true,
        message: 'Configurações restauradas para os padrões institucionais.',
        data: reset,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao restaurar configurações.',
      });
    }
  };

  anonymizeTeacher = async (req: Request, res: Response): Promise<void> => {
    try {
      const teacherId = resolveTeacherId(req);
      const result = await this.settingsService.anonymizeTeacher(teacherId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao anonimizar dados do usuário.',
      });
    }
  };
}
