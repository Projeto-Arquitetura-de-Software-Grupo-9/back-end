import { Router } from 'express';
import { DisciplinaController } from '../controllers/DisciplinaController';
import { IDisciplinaRepository } from '../repositories/interfaces/IDisciplinaRepository';
import { IExamRepository } from '../repositories/interfaces/IExamRepository';
import { repositories } from '../repositories';

export function createDisciplinaRouter(
  repo?: IDisciplinaRepository,
  examRepo?: IExamRepository
): Router {
  const repository = repo || repositories.disciplina;
  const examRepository = examRepo || repositories.examLayout;
  const controller = new DisciplinaController(repository);
  const router = Router();

  router.get('/', controller.list);
  // Provas vinculadas a uma disciplina
  router.get('/:id/exams', async (req, res) => {
    try {
      const exams = await examRepository.listExams(req.params.id);
      res.status(200).json({ success: true, count: exams.length, data: exams });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao listar provas da disciplina.' });
    }
  });
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
