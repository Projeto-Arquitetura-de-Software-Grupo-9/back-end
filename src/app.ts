import express, { Request, Response } from 'express';
import cors from 'cors';
import { createQrCodeRouter } from './routes/qrCodeRoutes';
import { createExamRouter } from './routes/examRoutes';
import { createSettingsRouter } from './routes/settingsRoutes';
import { createStudentRouter } from './routes/studentRoutes';
import { createQuestionRouter } from './routes/questionRoutes';

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
      database: 'mysql://127.0.0.1:3306/sgp_catolica',
      timestamp: new Date().toISOString(),
      modules: {
        qrCode: 'active (MySQL Prisma)',
        examPdf: 'active (MySQL Prisma & A4 layout engine)',
        settings: 'active (MySQL Prisma)',
        students: 'active (MySQL Prisma & Excel import/export)',
        questions: 'active (MySQL Prisma)',
      },
    });
  });

  // Modules
  app.use('/api/v1/qr-codes', createQrCodeRouter());
  app.use('/api/v1/exams', createExamRouter());
  app.use('/api/v1/settings', createSettingsRouter());
  app.use('/api/v1/students', createStudentRouter());
  app.use('/api/v1/questions', createQuestionRouter());

  return app;
}
