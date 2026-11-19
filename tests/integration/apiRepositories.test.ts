import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../src/app';
import { createRepositories, getActiveDataSource } from '../../src/repositories';
import { PrismaProfessorRepository } from '../../src/repositories/prisma/PrismaProfessorRepository';
import { PrismaDisciplinaRepository } from '../../src/repositories/prisma/PrismaDisciplinaRepository';
import { PrismaTurmaRepository } from '../../src/repositories/prisma/PrismaTurmaRepository';
import { PrismaCorrecaoRepository } from '../../src/repositories/prisma/PrismaCorrecaoRepository';
import { PrismaStudentRepository } from '../../src/repositories/prisma/PrismaStudentRepository';
import { PrismaQuestionRepository } from '../../src/repositories/prisma/PrismaQuestionRepository';
import { PrismaExamRepository } from '../../src/repositories/prisma/PrismaExamRepository';
import { PrismaExamVariationRepository } from '../../src/repositories/prisma/PrismaExamVariationRepository';
import { PrismaSettingsRepository } from '../../src/repositories/prisma/PrismaSettingsRepository';
import { PrismaQrCodeRepository } from '../../src/repositories/prisma/PrismaQrCodeRepository';

describe('Hexagonal Architecture & Database-Only Repositories Integration', () => {
  it('should always use database dataSource with Prisma repositories (zero production mocks)', () => {
    assert.equal(getActiveDataSource(), 'database');

    const dbRepos = createRepositories();
    assert.equal(dbRepos.source, 'database');
    assert.ok(dbRepos.professor instanceof PrismaProfessorRepository);
    assert.ok(dbRepos.disciplina instanceof PrismaDisciplinaRepository);
    assert.ok(dbRepos.turma instanceof PrismaTurmaRepository);
    assert.ok(dbRepos.correcao instanceof PrismaCorrecaoRepository);
    assert.ok(dbRepos.student instanceof PrismaStudentRepository);
    assert.ok(dbRepos.question instanceof PrismaQuestionRepository);
    assert.ok(dbRepos.settings instanceof PrismaSettingsRepository);
    assert.ok(dbRepos.examLayout instanceof PrismaExamRepository);
    assert.ok(dbRepos.examVariation instanceof PrismaExamVariationRepository);
    assert.ok(dbRepos.qrCode instanceof PrismaQrCodeRepository);
  });

  it('should initialize Express app with health endpoint reporting database source', async () => {
    const app = createApp();
    assert.equal(typeof app.listen, 'function');

    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const port = (server.address() as { port: number }).port;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/health`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.status, 'ok');
      assert.equal(body.dataSource, 'database');
      assert.ok(body.modules.auth);
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
