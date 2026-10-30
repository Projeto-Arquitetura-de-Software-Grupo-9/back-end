import express, { Request, Response } from 'express';
import cors from 'cors';
import { getActiveDataSource } from './repositories';
import { createQrCodeRouter } from './routes/qrCodeRoutes';
import { createExamRouter } from './routes/examRoutes';
import { createSettingsRouter } from './routes/settingsRoutes';
import { createStudentRouter } from './routes/studentRoutes';
import { createQuestionRouter } from './routes/questionRoutes';
import { createProfessorRouter } from './routes/professorRoutes';
import { createDisciplinaRouter } from './routes/disciplinaRoutes';
import { createTurmaRouter } from './routes/turmaRoutes';
import { createCorrecaoRouter } from './routes/correcaoRoutes';
import { createReportRouter } from './routes/reportRoutes';
import { createAnswerSheetRouter } from './routes/answerSheetRoutes';

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
        settings: 'active',
        students: 'active',
        questions: 'active',
        professores: 'active',
        disciplinas: 'active',
        turmas: 'active',
        exams: 'active (PDF layout, A4 generation & variations)',
        correcoes: 'active (OMR & manual assignment)',
        qrCode: 'active',
      },
    });
  });

  // Modules (Hexagonal Architecture / Repository Pattern)
  app.use('/api/v1/settings', createSettingsRouter());
  app.use('/api/v1/students', createStudentRouter());
  app.use('/api/v1/alunos', createStudentRouter()); // Alias em português
  app.use('/api/v1/questions', createQuestionRouter());
  app.use('/api/v1/questoes', createQuestionRouter()); // Alias em português
  app.use('/api/v1/professores', createProfessorRouter());
  app.use('/api/v1/disciplinas', createDisciplinaRouter());
  app.use('/api/v1/turmas', createTurmaRouter());
  app.use('/api/v1/exams', createExamRouter());
  app.use('/api/v1/correcoes', createCorrecaoRouter());
  app.use('/api/v1/reports', createReportRouter());
  app.use('/api/v1/answer-sheets', createAnswerSheetRouter());
  app.use('/api/v1/qr-codes', createQrCodeRouter());

  return app;
}
