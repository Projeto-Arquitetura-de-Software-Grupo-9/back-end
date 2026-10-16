import { Router } from 'express';
import { ProfessorController } from '../controllers/ProfessorController';
import { IProfessorRepository } from '../repositories/interfaces/IProfessorRepository';
import { repositories } from '../repositories';

export function createProfessorRouter(repo?: IProfessorRepository): Router {
  const repository = repo || repositories.professor;
  const controller = new ProfessorController(repository);
  const router = Router();

  router.post('/login', controller.login);
  router.post('/', controller.create);
  router.get('/:id', controller.getById);

  return router;
}
