import { Router } from 'express';
import { QrCodeController } from '../controllers/QrCodeController';
import { QrCodeService } from '../services/QrCodeService';
import { PrismaQrCodeRepository } from '../repositories/prisma/PrismaQrCodeRepository';
import { IQrCodeRepository } from '../repositories/interfaces/IQrCodeRepository';

export function createQrCodeRouter(repository?: IQrCodeRepository): Router {
  const repo = repository || new PrismaQrCodeRepository();
  const service = new QrCodeService(repo);
  const controller = new QrCodeController(service);

  const router = Router();

  // POST /api/v1/qr-codes/generate
  router.post('/generate', controller.generate);

  // GET /api/v1/qr-codes/version/:versionId
  router.get('/version/:versionId', controller.getByVersion);

  // POST /api/v1/qr-codes/validate
  router.post('/validate', controller.validate);

  return router;
}
