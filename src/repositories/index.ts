// Interfaces
export * from './interfaces/IProfessorRepository';
export * from './interfaces/IDisciplinaRepository';
export * from './interfaces/ITurmaRepository';
export * from './interfaces/ICorrecaoRepository';
export * from './interfaces/IStudentRepository';
export * from './interfaces/IQuestionRepository';
export * from './interfaces/ISettingsRepository';
export * from './interfaces/IExamRepository';
export * from './interfaces/IExamVariationRepository';
export * from './interfaces/IQrCodeRepository';

// Mock Implementations
import { MockProfessorRepository } from './mock/MockProfessorRepository';
import { MockDisciplinaRepository } from './mock/MockDisciplinaRepository';
import { MockTurmaRepository } from './mock/MockTurmaRepository';
import { MockCorrecaoRepository } from './mock/MockCorrecaoRepository';
import { MockStudentRepository } from './mock/MockStudentRepository';
import { MockQuestionRepository } from './mock/MockQuestionRepository';
import { MockSettingsRepository } from './mock/MockSettingsRepository';
import { MockExamRepository } from './mock/MockExamRepository';
import { MockExamVariationRepository } from './mock/MockExamVariationRepository';
import { MockQrCodeRepository } from './mock/MockQrCodeRepository';

// Prisma Implementations
import { PrismaProfessorRepository } from './prisma/PrismaProfessorRepository';
import { PrismaDisciplinaRepository } from './prisma/PrismaDisciplinaRepository';
import { PrismaTurmaRepository } from './prisma/PrismaTurmaRepository';
import { PrismaCorrecaoRepository } from './prisma/PrismaCorrecaoRepository';
import { PrismaStudentRepository } from './prisma/PrismaStudentRepository';
import { PrismaQuestionRepository } from './prisma/PrismaQuestionRepository';
import { PrismaSettingsRepository } from './prisma/PrismaSettingsRepository';
import { PrismaExamRepository } from './prisma/PrismaExamRepository';
import { PrismaExamVariationRepository } from './prisma/PrismaExamVariationRepository';
import { PrismaQrCodeRepository } from './prisma/PrismaQrCodeRepository';

export type DataSourceType = 'mock' | 'database';

let activeDataSource: DataSourceType = (process.env.DATA_SOURCE as DataSourceType) || 'database';

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
    correcao: isDb ? new PrismaCorrecaoRepository() : new MockCorrecaoRepository(),
    student: isDb ? new PrismaStudentRepository() : new MockStudentRepository(),
    question: isDb ? new PrismaQuestionRepository() : new MockQuestionRepository(),
    settings: isDb ? new PrismaSettingsRepository() : new MockSettingsRepository(),
    examLayout: isDb ? new PrismaExamRepository() : new MockExamRepository(),
    examVariation: isDb ? new PrismaExamVariationRepository() : new MockExamVariationRepository(),
    qrCode: isDb ? new PrismaQrCodeRepository() : new MockQrCodeRepository(),
  };
}

// Repositórios ativos prontos para consumo na aplicação
export const repositories = createRepositories();
