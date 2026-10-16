import { Router } from 'express';
import { SettingsController } from '../controllers/SettingsController';
import { ISettingsRepository } from '../repositories/interfaces/ISettingsRepository';
import { PrismaSettingsRepository } from '../repositories/prisma/PrismaSettingsRepository';
import { SettingsService } from '../services/SettingsService';

export function createSettingsRouter(repository?: ISettingsRepository): Router {
  const repo = repository || new PrismaSettingsRepository();
  const service = new SettingsService(repo);
  const controller = new SettingsController(service);

  const router = Router();

  router.get('/', controller.getSettings);
  router.put('/', controller.updateSettings);
  router.post('/reset', controller.resetSettings);
  router.post('/anonymize', controller.anonymizeTeacher);

  return router;
}
