import { createApp } from './app';
import { connectDatabase, seedDatabaseIfEmpty } from './config/database';

const PORT = process.env.PORT || 3001;
const app = createApp();

async function bootstrap() {
  const connected = await connectDatabase();
  if (connected) {
    await seedDatabaseIfEmpty();
  }

  app.listen(PORT, () => {
    console.log(`🚀 Correge API Backend running on http://localhost:${PORT}`);
    console.log(`🗄️  MySQL connected at 127.0.0.1:3306 (database: sgp_catolica)`);
    console.log(`📡 QR Code endpoints available at http://localhost:${PORT}/api/v1/qr-codes`);
    console.log(`⚙️  Settings endpoints available at http://localhost:${PORT}/api/v1/settings`);
    console.log(`🎓 Students endpoints available at http://localhost:${PORT}/api/v1/students`);
    console.log(`📚 Questions Bank endpoints available at http://localhost:${PORT}/api/v1/questions`);
  });
}

bootstrap();
