import { createApp } from './app';
import { connectDatabase, seedDatabaseIfEmpty } from './config/database';

const PORT = process.env.PORT || 3001;
export const app = createApp();

async function bootstrap() {
  if (process.env.VERCEL) {
    return;
  }

  try {
    const connected = await connectDatabase();
    if (connected) {
      await seedDatabaseIfEmpty();
    }
  } catch (err: any) {
    console.warn('⚠️ Database connection deferred/unavailable:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Correge API Backend running on http://localhost:${PORT}`);
    console.log(`📡 QR Code endpoints available at http://localhost:${PORT}/api/v1/qr-codes`);
    console.log(`⚙️  Settings endpoints available at http://localhost:${PORT}/api/v1/settings`);
    console.log(`🎓 Students endpoints available at http://localhost:${PORT}/api/v1/students`);
    console.log(`📚 Questions Bank endpoints available at http://localhost:${PORT}/api/v1/questions`);
  });
}

if (!process.env.VERCEL) {
  bootstrap();
}

export default app;
