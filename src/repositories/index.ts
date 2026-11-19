import dotenv from 'dotenv';
dotenv.config();

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

// Prisma Implementations (MySQL / TiDB Cloud)
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

export type DataSourceType = 'database';

export function getActiveDataSource(): DataSourceType {
  return 'database';
}

/**
 * Repository Factory / Dependency Injection Provider.
 * Opera exclusivamente sobre o banco de dados relacional via Prisma ORM (sem mocks).
 */
export function createRepositories() {
  return {
    source: 'database' as DataSourceType,
    professor: new PrismaProfessorRepository(),
    disciplina: new PrismaDisciplinaRepository(),
    turma: new PrismaTurmaRepository(),
    correcao: new PrismaCorrecaoRepository(),
    student: new PrismaStudentRepository(),
    question: new PrismaQuestionRepository(),
    settings: new PrismaSettingsRepository(),
    examLayout: new PrismaExamRepository(),
    examVariation: new PrismaExamVariationRepository(),
    qrCode: new PrismaQrCodeRepository(),
  };
}

// Repositórios ativos prontos para consumo na aplicação
export const repositories = createRepositories();
