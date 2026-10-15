import { createApp } from './app';

const PORT = process.env.PORT || 3001;
const app = createApp();

app.listen(PORT, () => {
  console.log(`🚀 Correge API Backend running on http://localhost:${PORT}`);
  console.log(`📡 QR Code endpoints available at http://localhost:${PORT}/api/v1/qr-codes`);
});
