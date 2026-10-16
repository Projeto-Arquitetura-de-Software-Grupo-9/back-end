import { Router } from 'express';
import { ExamController } from '../controllers/ExamController';
import { ExamVariationController } from '../controllers/ExamVariationController';
import { ProvaCrudController } from '../controllers/ProvaCrudController';
import { IExamRepository } from '../repositories/interfaces/IExamRepository';
import { IExamVariationRepository } from '../repositories/interfaces/IExamVariationRepository';
import { IProvaRepository } from '../repositories/interfaces/IProvaRepository';
import { repositories } from '../repositories';
import { ExamPdfService } from '../services/ExamPdfService';
import { ExamVariationService } from '../services/ExamVariationService';

export function createExamRouter(
  repository?: IExamRepository,
  variationRepository?: IExamVariationRepository,
  provaRepository?: IProvaRepository
): Router {
  const repo = repository || repositories.examLayout;
  const service = new ExamPdfService(repo);
  const controller = new ExamController(service);

  const varRepo = variationRepository || repositories.examVariation;
  const varService = new ExamVariationService(varRepo);
  const varController = new ExamVariationController(varService);

  const provaRepo = provaRepository || repositories.prova;
  const crudController = new ProvaCrudController(provaRepo);

  const router = Router();

  // CRUD Geral de Provas (Alinhado ao Diagrama de Classes)
  router.get('/', crudController.list);
  router.post('/', crudController.create);
  router.get('/:id', crudController.getById);
  router.put('/:id', crudController.update);
  router.delete('/:id', crudController.delete);

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
