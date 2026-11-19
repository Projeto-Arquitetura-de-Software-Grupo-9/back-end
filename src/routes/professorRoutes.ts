import { Router } from 'express';
import { ProfessorController } from '../controllers/ProfessorController';
import { IProfessorRepository } from '../repositories/interfaces/IProfessorRepository';
import { repositories } from '../repositories';
import { createAuthRateLimiter, requireAuth } from '../middlewares/authMiddleware';

export function createProfessorRouter(repo?: IProfessorRepository): Router {
  const repository = repo || repositories.professor;
  const controller = new ProfessorController(repository);
  const authRateLimiter = createAuthRateLimiter();
  const router = Router();

  router.post('/login', authRateLimiter, controller.login);
  router.post('/register', authRateLimiter, controller.create);
  router.post('/forgot-password', authRateLimiter, controller.forgotPassword);
  router.post('/reset-password', authRateLimiter, controller.resetPassword);
  router.get('/me', requireAuth, controller.me);
  router.put('/me/password', requireAuth, controller.changePassword);
  router.put('/password', requireAuth, controller.changePassword);
  router.post('/me/anonymize', requireAuth, controller.anonymizeMe);
  router.post('/logout', requireAuth, (_req, res) => {
    res.status(200).json({ success: true, message: 'Sessão encerrada com sucesso.' });
  });
  router.post('/', authRateLimiter, controller.create);
  router.get('/:id', controller.getById);

  return router;
}
