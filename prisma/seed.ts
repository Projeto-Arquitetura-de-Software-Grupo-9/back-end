import { prisma, connectDatabase } from '../src/config/database';

async function main() {
  const connected = await connectDatabase();
  if (!connected) {
    throw new Error('Não foi possível conectar ao banco de dados para validação.');
  }

  const [professores, disciplinas, turmas, alunos, questoes, provas] = await Promise.all([
    prisma.professor.count(),
    prisma.disciplina.count(),
    prisma.turma.count(),
    prisma.student.count(),
    prisma.question.count(),
    prisma.exam.count(),
  ]);

  console.log('✅ Banco de dados validado (sem inserção de dados fictícios/mock):', {
    professores,
    disciplinas,
    turmas,
    alunos,
    questoes,
    provas,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
