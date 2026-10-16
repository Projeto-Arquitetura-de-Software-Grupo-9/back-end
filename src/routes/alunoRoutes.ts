import { Router } from 'express';
import { AlunoController } from '../controllers/AlunoController';
import { IAlunoRepository } from '../repositories/interfaces/IAlunoRepository';
import { repositories } from '../repositories';

export function createAlunoRouter(repo?: IAlunoRepository): Router {
  const repository = repo || repositories.aluno;
  const controller = new AlunoController(repository);
  const router = Router();

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.post('/batch', controller.createBatch);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
