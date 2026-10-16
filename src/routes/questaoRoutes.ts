import { Router } from 'express';
import { QuestaoController } from '../controllers/QuestaoController';
import { IQuestaoRepository } from '../repositories/interfaces/IQuestaoRepository';
import { repositories } from '../repositories';

export function createQuestaoRouter(repo?: IQuestaoRepository): Router {
  const repository = repo || repositories.questao;
  const controller = new QuestaoController(repository);
  const router = Router();

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
