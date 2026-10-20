import { Router } from 'express';
import { ExamController } from '../controllers/ExamController';
import { ExamVariationController } from '../controllers/ExamVariationController';
import { IExamRepository } from '../repositories/interfaces/IExamRepository';
import { IExamVariationRepository } from '../repositories/interfaces/IExamVariationRepository';
import { repositories } from '../repositories';
import { ExamPdfService } from '../services/ExamPdfService';
import { ExamVariationService } from '../services/ExamVariationService';

export function createExamRouter(
  repository?: IExamRepository,
  variationRepository?: IExamVariationRepository
): Router {
  const repo = repository || repositories.examLayout;
  const service = new ExamPdfService(repo);
  const controller = new ExamController(service);

  const varRepo = variationRepository || repositories.examVariation;
  const varService = new ExamVariationService(varRepo);
  const varController = new ExamVariationController(varService);

  const router = Router();

  // CRUD Endpoints
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:id', controller.getById);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

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
