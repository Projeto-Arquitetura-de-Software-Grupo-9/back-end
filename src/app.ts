import express, { Request, Response } from 'express';
import cors from 'cors';
import { createQrCodeRouter } from './routes/qrCodeRoutes';

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
      modules: {
        qrCode: 'active (mock repository)',
      },
    });
  });

  // QR Code Module
  app.use('/api/v1/qr-codes', createQrCodeRouter());

  return app;
}
