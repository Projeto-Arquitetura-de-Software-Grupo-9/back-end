import express, { Request, Response } from 'express';
import cors from 'cors';
import { getActiveDataSource } from './repositories';
import { createQrCodeRouter } from './routes/qrCodeRoutes';
import { createExamRouter } from './routes/examRoutes';
import { createProfessorRouter } from './routes/professorRoutes';
import { createDisciplinaRouter } from './routes/disciplinaRoutes';
import { createTurmaRouter } from './routes/turmaRoutes';
import { createAlunoRouter } from './routes/alunoRoutes';
import { createQuestaoRouter } from './routes/questaoRoutes';
import { createCorrecaoRouter } from './routes/correcaoRoutes';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'correge-backend',
      timestamp: new Date().toISOString(),
      dataSource: getActiveDataSource(),
      modules: {
        professores: 'active',
        disciplinas: 'active',
        turmas: 'active',
        alunos: 'active',
        questoes: 'active',
        exams: 'active (PDF layout, variations & CRUD)',
        correcoes: 'active (OMR & manual assignment)',
        qrCode: 'active',
      },
    });
  });

  // API Routes (Hexagonal Architecture / Repository Pattern)
  app.use('/api/v1/professores', createProfessorRouter());
  app.use('/api/v1/disciplinas', createDisciplinaRouter());
  app.use('/api/v1/turmas', createTurmaRouter());
  app.use('/api/v1/alunos', createAlunoRouter());
  app.use('/api/v1/questoes', createQuestaoRouter());
  app.use('/api/v1/exams', createExamRouter());
  app.use('/api/v1/correcoes', createCorrecaoRouter());
  app.use('/api/v1/qr-codes', createQrCodeRouter());

  return app;
}
