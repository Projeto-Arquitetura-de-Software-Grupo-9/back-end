import { Router } from 'express';
import multer from 'multer';
import { StudentController } from '../controllers/StudentController';
import { IStudentRepository } from '../repositories/interfaces/IStudentRepository';
import { repositories } from '../repositories';
import { StudentService } from '../services/StudentService';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Upload com tratamento de erro (tamanho excedido etc.) em vez de erro 500 genérico
const uploadFile = (req: any, res: any, next: any): void => {
  (upload.single('file') as any)(req, res, (err: any) => {
    if (err) {
      res.status(400).json({
        success: false,
        error: err.code === 'LIMIT_FILE_SIZE' ? 'Arquivo maior que 5 MB.' : err.message || 'Erro no upload do arquivo.',
      });
      return;
    }
    next();
  });
};

export function createStudentRouter(repository?: IStudentRepository): Router {
  const repo = repository || repositories.student;
  const service = new StudentService(repo);
  const controller = new StudentController(service);

  const router = Router();

  router.get('/', controller.list);
  router.get('/disciplines', controller.getDisciplines);
  router.get('/export-excel', controller.exportExcel);
  router.get('/import-template', controller.importTemplate);
  router.post('/import', uploadFile, controller.importStudents);
  router.post('/batch', uploadFile, controller.importStudents);
  router.post('/batch-delete', controller.deleteBatch);
  router.delete('/batch', controller.deleteBatch);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}