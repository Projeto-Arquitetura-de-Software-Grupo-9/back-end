import { Router } from 'express';
import { ExamController } from '../controllers/ExamController';
import { ExamVariationController } from '../controllers/ExamVariationController';
import { IExamRepository } from '../repositories/interfaces/IExamRepository';
import { IExamVariationRepository } from '../repositories/interfaces/IExamVariationRepository';
import { MockExamRepository } from '../repositories/mock/MockExamRepository';
import { MockExamVariationRepository } from '../repositories/mock/MockExamVariationRepository';
import { ExamPdfService } from '../services/ExamPdfService';
import { ExamVariationService } from '../services/ExamVariationService';

export function createExamRouter(
  repository?: IExamRepository,
  variationRepository?: IExamVariationRepository
): Router {
  const repo = repository || new MockExamRepository();
  const service = new ExamPdfService(repo);
  const controller = new ExamController(service);

  const varRepo = variationRepository || new MockExamVariationRepository();
  const varService = new ExamVariationService(varRepo);
  const varController = new ExamVariationController(varService);

  const router = Router();

  // Layout & PDF Endpoints
  router.get('/:id/layout', controller.getLayout);
  router.post('/:id/generate-pdf', controller.generatePdf);
  router.get('/:id/download-pdf', controller.downloadPdf);

  // Variations (Criar Provas Diferentes) Endpoints
  router.post('/:id/variations/generate', varController.generate);
  router.get('/:id/variations', varController.get);
  router.post('/:id/variations/distribute', varController.distribute);

  return router;
}
