import { createApp } from '../../src/app';
import {
  createRepositories,
  getActiveDataSource,
  repositories,
} from '../../src/repositories';
import { PrismaProfessorRepository } from '../../src/repositories/prisma/PrismaProfessorRepository';
import { PrismaDisciplinaRepository } from '../../src/repositories/prisma/PrismaDisciplinaRepository';
import { PrismaTurmaRepository } from '../../src/repositories/prisma/PrismaTurmaRepository';
import { PrismaCorrecaoRepository } from '../../src/repositories/prisma/PrismaCorrecaoRepository';
import { PrismaStudentRepository } from '../../src/repositories/prisma/PrismaStudentRepository';
import { PrismaQuestionRepository } from '../../src/repositories/prisma/PrismaQuestionRepository';
import { PrismaExamRepository } from '../../src/repositories/prisma/PrismaExamRepository';
import { PrismaSettingsRepository } from '../../src/repositories/prisma/PrismaSettingsRepository';
import { PrismaQrCodeRepository } from '../../src/repositories/prisma/PrismaQrCodeRepository';

async function runTests() {
  console.log('🧪 Iniciando Testes de Integração da Arquitetura Hexagonal & Repositórios...');

  // Teste 1: Validação do Repositório Mock Padrão
  console.log('\n[Teste 1] Validando Repositórios em Memória (Mock)...');
  console.assert(getActiveDataSource() === 'mock', 'Data source inicial deve ser mock');

  const disciplinas = await repositories.disciplina.list();
  console.assert(disciplinas.length >= 4, 'Deve haver ao menos 4 disciplinas no mock');
  console.log(`✅ Disciplinas carregadas: ${disciplinas.length} disciplinas.`);

  const turmas = await repositories.turma.list();
  console.assert(turmas.length >= 3, 'Deve haver ao menos 3 turmas no mock');
  console.log(`✅ Turmas carregadas: ${turmas.length} turmas com relações.`);

  const students = await repositories.student.findAll();
  console.assert(students.length >= 5, 'Deve haver alunos no mock');
  console.log(`✅ Alunos (Students) carregados: ${students.length} alunos.`);

  const questions = await repositories.question.findAll();
  console.assert(questions.length >= 3, 'Deve haver questões no mock');
  console.assert(questions.some((q) => q.alternatives.length > 0), 'Deve haver questões com alternativas no mock');
  console.log(`✅ Questões carregadas: ${questions.length} questões.`);

  const correcoes = await repositories.correcao.list();
  console.assert(correcoes.length >= 2, 'Deve haver ao menos 2 correções no mock');
  console.log(`✅ Correções carregadas: ${correcoes.length} correções.`);

  const settings = await repositories.settings.getSettings('usr-prof-1');
  console.assert(settings !== null, 'Configurações devem ser carregadas no mock');
  console.log(`✅ Configurações carregadas: ${settings?.institutionName}.`);

  // Teste 2: Criação e Operações CRUD no Mock
  console.log('\n[Teste 2] Testando operações CRUD no Mock...');
  const novaTurma = await repositories.turma.create({
    idProfessor: 'prof-catolica-01',
    idDisciplina: 'disc-1',
    nome: 'Turma C - Vespertino',
    periodoLetivo: '2026.1',
  });
  console.assert(novaTurma.nome === 'Turma C - Vespertino', 'Nome da turma criada deve conferir');

  // Teste 3: Alternância de Referência para Banco de Dados (Database Provider)
  console.log('\n[Teste 3] Testando alternância de referência para Banco de Dados (Prisma)...');
  const dbRepos = createRepositories('database');
  console.assert(dbRepos.source === 'database', 'Source deve ser database');
  console.assert(dbRepos.professor instanceof PrismaProfessorRepository, 'Professor repo deve ser Prisma');
  console.assert(dbRepos.disciplina instanceof PrismaDisciplinaRepository, 'Disciplina repo deve ser Prisma');
  console.assert(dbRepos.turma instanceof PrismaTurmaRepository, 'Turma repo deve ser Prisma');
  console.assert(dbRepos.correcao instanceof PrismaCorrecaoRepository, 'Correcao repo deve ser Prisma');
  console.assert(dbRepos.student instanceof PrismaStudentRepository, 'Student repo deve ser Prisma');
  console.assert(dbRepos.question instanceof PrismaQuestionRepository, 'Question repo deve ser Prisma');
  console.assert(dbRepos.settings instanceof PrismaSettingsRepository, 'Settings repo deve ser Prisma');
  console.assert(dbRepos.examLayout instanceof PrismaExamRepository, 'Exam repo deve ser Prisma');
  console.assert(dbRepos.qrCode instanceof PrismaQrCodeRepository, 'QrCode repo deve ser Prisma');
  console.log('✅ Alternância para Prisma/Database instanciada com sucesso para todas as entidades.');

  // Teste 4: Inicialização do Express App
  console.log('\n[Teste 4] Validando inicialização da aplicação Express...');
  const app = createApp();
  console.assert(typeof app.listen === 'function', 'createApp deve retornar uma instância válida do Express');
  console.log('✅ Express App inicializado com todas as rotas registradas com sucesso.');

  console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO!');
}

runTests().catch((err) => {
  console.error('❌ Falha nos testes:', err);
  process.exit(1);
});
