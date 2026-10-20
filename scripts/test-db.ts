import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { prisma, databaseUrl } from '../src/config/database';

async function main() {
  console.log('🔄 Conectando ao TiDB Cloud MySQL...');
  console.log('Host:', process.env.DB_HOST);
  console.log('Database:', process.env.DB_NAME);
  console.log('DATABASE_URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'));

  const configuredCa = process.env.CA || process.env.CA_PATH || 'prisma/isrgrootx1.pem';
  const certPath = path.resolve(process.cwd(), configuredCa);
  const certExists = fs.existsSync(certPath);
  console.log(`🔒 Certificado CA (${certPath}):`, certExists ? 'Encontrado ✅' : 'Não encontrado ❌');

  const res = await prisma.$queryRaw`SELECT VERSION() as version, DATABASE() as db`;
  console.log('✅ Conexão bem-sucedida ao TiDB Cloud!', res);

  console.log('\n📊 Contagem de registros nas tabelas do TiDB Cloud:');
  console.log('Settings:', await prisma.settings.count());
  console.log('Students:', await prisma.student.count());
  console.log('Questions:', await prisma.question.count());
  console.log('Alternatives:', await prisma.alternative.count());
  console.log('Exams:', await prisma.exam.count());
  console.log('ExamVersions:', await prisma.examVersion.count());
  console.log('QrCodes:', await prisma.qrCode.count());
  console.log('Professores:', await prisma.professor.count());
  console.log('Disciplinas:', await prisma.disciplina.count());
  console.log('Turmas:', await prisma.turma.count());
  console.log('Correcoes:', await prisma.correcao.count());
}

main()
  .catch((err) => {
    console.error('❌ Falha na conexão com o TiDB Cloud:', err.message);
    if (err.message.includes('10054') || err.message.includes('TLS')) {
      console.error('\n⚠️ Dica sobre erro 10054 / TLS:');
      console.error('1. Verifique se o IP atual está liberado na "IP Access List" do TiDB Cloud console.');
      console.error('2. Verifique se o cluster TiDB Serverless está ativo (não pausado por inatividade).');
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
