import { Router } from 'express';
import multer from 'multer';
import { StudentController } from '../controllers/StudentController';
import { IStudentRepository } from '../repositories/interfaces/IStudentRepository';
import { repositories } from '../repositories';
import { StudentService } from '../services/StudentService';

const upload = multer({ storage: multer.memoryStorage() });

export function createStudentRouter(repository?: IStudentRepository): Router {
  const repo = repository || repositories.student;
  const service = new StudentService(repo);
  const controller = new StudentController(service);

  const router = Router();

  router.get('/', controller.list);
  router.get('/disciplines', controller.getDisciplines);
  router.get('/export-excel', controller.exportExcel);
  router.post('/import', upload.single('file'), controller.importStudents);
  router.post('/batch', upload.single('file'), controller.importStudents);
  router.post('/batch-delete', controller.deleteBatch);
  router.delete('/batch', controller.deleteBatch);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
