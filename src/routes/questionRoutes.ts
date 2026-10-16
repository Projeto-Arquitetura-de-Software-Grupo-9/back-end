import { Router } from 'express';
import { QuestionController } from '../controllers/QuestionController';
import { IQuestionRepository } from '../repositories/interfaces/IQuestionRepository';
import { PrismaQuestionRepository } from '../repositories/prisma/PrismaQuestionRepository';
import { QuestionService } from '../services/QuestionService';

export function createQuestionRouter(repository?: IQuestionRepository): Router {
  const repo = repository || new PrismaQuestionRepository();
  const service = new QuestionService(repo);
  const controller = new QuestionController(service);

  const router = Router();

  router.get('/', controller.list);
  router.get('/tags', controller.getTags);
  router.get('/disciplines', controller.getDisciplines);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
