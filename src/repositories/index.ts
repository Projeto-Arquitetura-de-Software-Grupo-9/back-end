// Interfaces
export * from './interfaces/IProfessorRepository';
export * from './interfaces/IDisciplinaRepository';
export * from './interfaces/ITurmaRepository';
export * from './interfaces/IAlunoRepository';
export * from './interfaces/IQuestaoRepository';
export * from './interfaces/IProvaRepository';
export * from './interfaces/ICorrecaoRepository';
export * from './interfaces/IExamRepository';
export * from './interfaces/IExamVariationRepository';
export * from './interfaces/IQrCodeRepository';

// Mock Implementations
import { MockProfessorRepository } from './mock/MockProfessorRepository';
import { MockDisciplinaRepository } from './mock/MockDisciplinaRepository';
import { MockTurmaRepository } from './mock/MockTurmaRepository';
import { MockAlunoRepository } from './mock/MockAlunoRepository';
import { MockQuestaoRepository } from './mock/MockQuestaoRepository';
import { MockProvaRepository } from './mock/MockProvaRepository';
import { MockCorrecaoRepository } from './mock/MockCorrecaoRepository';
import { MockExamRepository } from './mock/MockExamRepository';
import { MockExamVariationRepository } from './mock/MockExamVariationRepository';
import { MockQrCodeRepository } from './mock/MockQrCodeRepository';

// Prisma Implementations
import { PrismaProfessorRepository } from './prisma/PrismaProfessorRepository';
import { PrismaDisciplinaRepository } from './prisma/PrismaDisciplinaRepository';
import { PrismaTurmaRepository } from './prisma/PrismaTurmaRepository';
import { PrismaAlunoRepository } from './prisma/PrismaAlunoRepository';
import { PrismaQuestaoRepository } from './prisma/PrismaQuestaoRepository';
import { PrismaProvaRepository } from './prisma/PrismaProvaRepository';
import { PrismaCorrecaoRepository } from './prisma/PrismaCorrecaoRepository';

export type DataSourceType = 'mock' | 'database';

let activeDataSource: DataSourceType = (process.env.DATA_SOURCE as DataSourceType) || 'mock';

export function getActiveDataSource(): DataSourceType {
  return activeDataSource;
}

export function setActiveDataSource(source: DataSourceType) {
  activeDataSource = source;
}

/**
 * Repository Factory / Dependency Injection Provider
 * Para alternar entre Mock e Database, basta definir DATA_SOURCE="database" no .env
 * ou chamar setActiveDataSource('database').
 */
export function createRepositories(source: DataSourceType = activeDataSource) {
  const isDb = source === 'database';

  return {
    source,
    professor: isDb ? new PrismaProfessorRepository() : new MockProfessorRepository(),
    disciplina: isDb ? new PrismaDisciplinaRepository() : new MockDisciplinaRepository(),
    turma: isDb ? new PrismaTurmaRepository() : new MockTurmaRepository(),
    aluno: isDb ? new PrismaAlunoRepository() : new MockAlunoRepository(),
    questao: isDb ? new PrismaQuestaoRepository() : new MockQuestaoRepository(),
    prova: isDb ? new PrismaProvaRepository() : new MockProvaRepository(),
    correcao: isDb ? new PrismaCorrecaoRepository() : new MockCorrecaoRepository(),
    examLayout: new MockExamRepository(),
    examVariation: new MockExamVariationRepository(),
    qrCode: new MockQrCodeRepository(),
  };
}

// Repositórios ativos prontos para consumo na aplicação
export const repositories = createRepositories();
