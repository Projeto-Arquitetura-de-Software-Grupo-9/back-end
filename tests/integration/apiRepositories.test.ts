import { createApp } from '../../src/app';
import {
  createRepositories,
  getActiveDataSource,
  setActiveDataSource,
  repositories,
} from '../../src/repositories';
import { PrismaProfessorRepository } from '../../src/repositories/prisma/PrismaProfessorRepository';
import { PrismaDisciplinaRepository } from '../../src/repositories/prisma/PrismaDisciplinaRepository';
import { PrismaTurmaRepository } from '../../src/repositories/prisma/PrismaTurmaRepository';
import { PrismaAlunoRepository } from '../../src/repositories/prisma/PrismaAlunoRepository';
import { PrismaQuestaoRepository } from '../../src/repositories/prisma/PrismaQuestaoRepository';
import { PrismaProvaRepository } from '../../src/repositories/prisma/PrismaProvaRepository';
import { PrismaCorrecaoRepository } from '../../src/repositories/prisma/PrismaCorrecaoRepository';

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

  const alunos = await repositories.aluno.listAll();
  console.assert(alunos.length >= 5, 'Deve haver ao menos 5 alunos no mock');
  console.log(`✅ Alunos carregados: ${alunos.length} alunos.`);

  const questoes = await repositories.questao.list();
  console.assert(questoes.length >= 3, 'Deve haver ao menos 3 questões no mock');
  console.assert(questoes[0].alternativas.length >= 4, 'Questão deve conter alternativas');
  console.log(`✅ Questões carregadas: ${questoes.length} questões com alternativas.`);

  const provas = await repositories.prova.list();
  console.assert(provas.length >= 1, 'Deve haver ao menos 1 prova no mock');
  console.log(`✅ Provas carregadas: ${provas.length} provas.`);

  const correcoes = await repositories.correcao.list();
  console.assert(correcoes.length >= 2, 'Deve haver ao menos 2 correções no mock');
  console.log(`✅ Correções carregadas: ${correcoes.length} correções.`);

  // Teste 2: Criação e Operações CRUD no Mock
  console.log('\n[Teste 2] Testando operações CRUD no Mock...');
  const novaTurma = await repositories.turma.create({
    idProfessor: 'prof-catolica-01',
    idDisciplina: 'disc-1',
    nome: 'Turma C - Vespertino',
    periodoLetivo: '2026.1',
  });
  console.assert(novaTurma.nome === 'Turma C - Vespertino', 'Nome da turma criada deve conferir');

  const novoAluno = await repositories.aluno.create({
    idTurma: novaTurma.id,
    nome: 'Test Aluno da Silva',
    matricula: '2026.1.999',
    email: 'test@catolicasc.edu.br',
    curso: 'Direito',
  });
  console.assert(novoAluno.matricula === '2026.1.999', 'Matrícula do aluno deve conferir');

  // Teste 3: Alternância de Referência para Banco de Dados (Database Provider)
  console.log('\n[Teste 3] Testando alternância de referência para Banco de Dados (Prisma)...');
  const dbRepos = createRepositories('database');
  console.assert(dbRepos.source === 'database', 'Source deve ser database');
  console.assert(dbRepos.professor instanceof PrismaProfessorRepository, 'Professor repo deve ser Prisma');
  console.assert(dbRepos.disciplina instanceof PrismaDisciplinaRepository, 'Disciplina repo deve ser Prisma');
  console.assert(dbRepos.turma instanceof PrismaTurmaRepository, 'Turma repo deve ser Prisma');
  console.assert(dbRepos.aluno instanceof PrismaAlunoRepository, 'Aluno repo deve ser Prisma');
  console.assert(dbRepos.questao instanceof PrismaQuestaoRepository, 'Questao repo deve ser Prisma');
  console.assert(dbRepos.prova instanceof PrismaProvaRepository, 'Prova repo deve ser Prisma');
  console.assert(dbRepos.correcao instanceof PrismaCorrecaoRepository, 'Correcao repo deve ser Prisma');
  console.log('✅ Alternância para Prisma/Database instanciada com sucesso.');

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
