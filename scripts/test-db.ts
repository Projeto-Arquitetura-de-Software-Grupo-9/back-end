import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Conectando ao TiDB Cloud MySQL...');
  console.log('Host:', process.env.DB_HOST);
  console.log('Database:', process.env.DB_NAME);

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
    console.error('❌ Falha na conexão com o TiDB Cloud:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
