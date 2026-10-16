import { Request, Response } from 'express';
import { ISettingsService } from '../services/interfaces/ISettingsService';

export class SettingsController {
  constructor(private readonly settingsService: ISettingsService) {}

  getSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const teacherId = (req.query.teacherId as string) || 'usr-prof-1';
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
      const teacherId = (req.body.teacherId as string) || 'usr-prof-1';
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
      const teacherId = (req.body?.teacherId as string) || 'usr-prof-1';
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
      const teacherId = (req.body?.teacherId as string) || 'usr-prof-1';
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
