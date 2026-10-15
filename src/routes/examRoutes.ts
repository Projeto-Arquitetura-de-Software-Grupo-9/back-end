import { Router } from 'express';
import { ExamController } from '../controllers/ExamController';
import { IExamRepository } from '../repositories/interfaces/IExamRepository';
import { MockExamRepository } from '../repositories/mock/MockExamRepository';
import { ExamPdfService } from '../services/ExamPdfService';

export function createExamRouter(repository?: IExamRepository): Router {
  const repo = repository || new MockExamRepository();
  const service = new ExamPdfService(repo);
  const controller = new ExamController(service);

  const router = Router();

  // GET /api/v1/exams/:id/layout
  router.get('/:id/layout', controller.getLayout);

  // POST /api/v1/exams/:id/generate-pdf
  router.post('/:id/generate-pdf', controller.generatePdf);

  // GET /api/v1/exams/:id/download-pdf
  router.get('/:id/download-pdf', controller.downloadPdf);

  return router;
}
