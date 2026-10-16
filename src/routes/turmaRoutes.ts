import { Router } from 'express';
import { TurmaController } from '../controllers/TurmaController';
import { ITurmaRepository } from '../repositories/interfaces/ITurmaRepository';
import { repositories } from '../repositories';

export function createTurmaRouter(repo?: ITurmaRepository): Router {
  const repository = repo || repositories.turma;
  const controller = new TurmaController(repository);
  const router = Router();

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
