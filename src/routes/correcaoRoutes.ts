import { Router } from 'express';
import { CorrecaoController } from '../controllers/CorrecaoController';
import { ICorrecaoRepository } from '../repositories/interfaces/ICorrecaoRepository';
import { repositories } from '../repositories';

export function createCorrecaoRouter(repo?: ICorrecaoRepository): Router {
  const repository = repo || repositories.correcao;
  const controller = new CorrecaoController(repository);
  const router = Router();

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.patch('/:id/assign-student', controller.assignStudent);
  router.delete('/:id', controller.delete);

  return router;
}
