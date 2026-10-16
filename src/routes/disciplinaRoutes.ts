import { Router } from 'express';
import { DisciplinaController } from '../controllers/DisciplinaController';
import { IDisciplinaRepository } from '../repositories/interfaces/IDisciplinaRepository';
import { repositories } from '../repositories';

export function createDisciplinaRouter(repo?: IDisciplinaRepository): Router {
  const repository = repo || repositories.disciplina;
  const controller = new DisciplinaController(repository);
  const router = Router();

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
