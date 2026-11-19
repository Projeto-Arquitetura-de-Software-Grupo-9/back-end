import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import { TestExamRepository, TestExamVariationRepository, TestProfessorRepository } from '../helpers/inMemoryRepositories';
import { createProfessorRouter } from '../../src/routes/professorRoutes';
import { ExamVariationService } from '../../src/services/ExamVariationService';
import { ExamRecordDTO } from '../../src/repositories/interfaces/IExamRepository';
import { ExamQuestionLayoutDTO } from '../../src/types/examPdf.dto';

function makeSampleQuestions(): ExamQuestionLayoutDTO[] {
  return Array.from({ length: 5 }, (_, i) => ({
    id: `q-${i + 1}`,
    originalQuestionId: `q-${i + 1}`,
    orderIndex: i + 1,
    statement: `Enunciado da questão ${i + 1}`,
    discipline: 'Direito Constitucional',
    alternatives: [
      { id: `a-${i}-1`, letter: 'A', text: `Alternativa A da Q${i + 1}` },
      { id: `a-${i}-2`, letter: 'B', text: `Alternativa B da Q${i + 1}` },
      { id: `a-${i}-3`, letter: 'C', text: `Alternativa C da Q${i + 1}` },
      { id: `a-${i}-4`, letter: 'D', text: `Alternativa D da Q${i + 1}` },
    ],
    correctAlternative: 'B',
    pointValue: 2.0,
  }));
}

function makeSampleExams(): ExamRecordDTO[] {
  return [
    {
      id: 'exam-test-01',
      code: '#DIR-01',
      title: 'Avaliação de Direito Constitucional',
      subtitle: '2026.1',
      institution: 'CATÓLICA DE SANTA CATARINA',
      department: 'Direito',
      course: 'Direito',
      discipline: 'Direito Constitucional',
      disciplinaId: 'disc-01',
      classGroup: 'Turma A',
      semester: '2026.1',
      date: '10/05/2026',
      duration: '2 horas',
      instructions: ['Marque apenas uma alternativa.'],
      includeBoxNota: false,
      createdAt: new Date(),
    },
    {
      id: 'exam-test-02',
      code: '#MAT-01',
      title: 'Avaliação de Cálculo I',
      subtitle: '2026.1',
      institution: 'CATÓLICA DE SANTA CATARINA',
      department: 'Engenharia',
      course: 'Engenharia de Software',
      discipline: 'Cálculo I',
      disciplinaId: 'disc-02',
      classGroup: 'Turma B',
      semester: '2026.1',
      date: '12/05/2026',
      duration: '2 horas',
      instructions: ['Use caneta azul ou preta.'],
      includeBoxNota: false,
      createdAt: new Date(),
    },
  ];
}

describe('Exam Repository CRUD & Variations Tests', () => {
  it('should list exams and filter by disciplinaId', async () => {
    const repo = new TestExamRepository(makeSampleExams(), makeSampleQuestions());
    const all = await repo.listExams();
    assert.equal(all.length, 2);

    const filtered = await repo.listExams('disc-01');
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, 'exam-test-01');
  });

  it('should create, update, and delete an exam cleanly', async () => {
    const repo = new TestExamRepository([], makeSampleQuestions());
    const created = await repo.createExam({
      title: 'Avaliação de Direito Penal',
      institution: 'Católica SC',
      department: 'Direito',
      course: 'Direito',
      discipline: 'Direito Penal',
      classGroup: 'Turma B',
      semester: '2026.1',
      date: '20/11/2026',
      duration: '2 horas',
      instructions: ['Instrução 1'],
      includeBoxNota: false,
    });

    assert.ok(created.id);
    assert.equal(created.includeBoxNota, false);

    const updated = await repo.updateExam(created.id, { title: 'Avaliação de Direito Penal - Atualizada' });
    assert.equal(updated.title, 'Avaliação de Direito Penal - Atualizada');

    const deleted = await repo.deleteExam(created.id);
    assert.equal(deleted, true);
    assert.equal(await repo.findExamById(created.id), null);
  });

  it('should map crossAnswerKeyMatrix dynamically up to 26 versions (A..Z)', async () => {
    const varRepo = new TestExamVariationRepository(makeSampleQuestions());
    const service = new ExamVariationService(varRepo);

    const result = await service.generateVariations({
      examId: 'exam-test-01',
      numberOfVersions: 5,
      shuffleQuestions: true,
      shuffleAlternatives: true,
      strategy: 'FISHER_YATES',
    });

    assert.equal(result.versions.length, 5);
    assert.equal(result.versions[4].versionLetter, 'E');
    const entry = result.crossAnswerKeyMatrix[0];
    assert.ok(entry.orderIndexE !== undefined);
    assert.ok(entry.correctLetterE !== undefined);
  });
});

describe('Authentication & Professor Security Tests (JWT + bcrypt + LGPD)', () => {
  async function startAuthServer(repo: TestProfessorRepository) {
    const app = express();
    app.use(express.json());
    app.use('/api/v1/professores', createProfessorRouter(repo));
    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const port = (server.address() as { port: number }).port;
    return { server, base: `http://127.0.0.1:${port}/api/v1/professores` };
  }

  it('should enforce institutional domain, bcrypt hash, JWT issuance, /me, password change, and LGPD anonymization', async () => {
    const repo = new TestProfessorRepository();
    const { server, base } = await startAuthServer(repo);

    try {
      // 1. Reject non-institutional domain
      const badDomain = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeCompleto: 'Professor Externo',
          email: 'externo@gmail.com',
          senha: 'SenhaForte123!',
        }),
      });
      assert.equal(badDomain.status, 400);

      // 2. Register valid institutional teacher
      const regRes = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeCompleto: 'Prof. Roberto Santos',
          email: 'Roberto.Santos@catolicasc.org.br',
          senha: 'SenhaForte123!',
        }),
      });
      assert.equal(regRes.status, 201);
      const regJson = await regRes.json();
      assert.equal(regJson.success, true);
      assert.equal(regJson.data.email, 'roberto.santos@catolicasc.org.br');
      assert.ok(regJson.data.token);

      const stored = await repo.findByEmail('roberto.santos@catolicasc.org.br');
      assert.ok(stored && stored.senhaHash.startsWith('$2'));
      assert.notEqual(stored?.senhaHash, 'SenhaForte123!');

      // 3. Reject wrong password
      const wrongLogin = await fetch(`${base}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'roberto.santos@catolicasc.org.br',
          senha: 'SenhaErrada123!',
        }),
      });
      assert.equal(wrongLogin.status, 401);

      // 4. Reject non-bcrypt legacy plaintext hash (no mock bypass)
      await repo.create({
        nomeCompleto: 'Legado Sem Hash',
        email: 'legado@catolicasc.org.br',
        senhaHash: 'SenhaTextoPuro123',
      });
      const legacyLogin = await fetch(`${base}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'legado@catolicasc.org.br',
          senha: 'SenhaTextoPuro123',
        }),
      });
      assert.equal(legacyLogin.status, 401);

      // 5. Login with valid credentials (case-insensitive email)
      const okLogin = await fetch(`${base}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'ROBERTO.SANTOS@catolicasc.org.br',
          senha: 'SenhaForte123!',
        }),
      });
      assert.equal(okLogin.status, 200);
      const loginJson = await okLogin.json();
      assert.ok(loginJson.data.token);
      const decoded = jwt.decode(loginJson.data.token) as any;
      assert.equal(decoded.email, 'roberto.santos@catolicasc.org.br');

      // 6. Protected /me endpoint
      const meUnauth = await fetch(`${base}/me`);
      assert.equal(meUnauth.status, 401);

      const meOk = await fetch(`${base}/me`, {
        headers: { Authorization: `Bearer ${loginJson.data.token}` },
      });
      assert.equal(meOk.status, 200);
      const meJson = await meOk.json();
      assert.equal(meJson.data.email, 'roberto.santos@catolicasc.org.br');

      // 7. Authenticated password change
      const chgRes = await fetch(`${base}/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginJson.data.token}`,
        },
        body: JSON.stringify({
          currentPassword: 'SenhaForte123!',
          newPassword: 'NovaSenhaSuperSegura2026!',
        }),
      });
      assert.equal(chgRes.status, 200);

      const oldPassFail = await fetch(`${base}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'roberto.santos@catolicasc.org.br',
          senha: 'SenhaForte123!',
        }),
      });
      assert.equal(oldPassFail.status, 401);

      const newPassOk = await fetch(`${base}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'roberto.santos@catolicasc.org.br',
          senha: 'NovaSenhaSuperSegura2026!',
        }),
      });
      assert.equal(newPassOk.status, 200);

      // 8. LGPD anonymization blocks subsequent login and /me
      const anonRes = await fetch(`${base}/me/anonymize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${loginJson.data.token}` },
      });
      assert.equal(anonRes.status, 200);

      const postAnonMe = await fetch(`${base}/me`, {
        headers: { Authorization: `Bearer ${loginJson.data.token}` },
      });
      assert.equal(postAnonMe.status, 401);

      const postAnonLogin = await fetch(`${base}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'roberto.santos@catolicasc.org.br',
          senha: 'NovaSenhaSuperSegura2026!',
        }),
      });
      assert.equal(postAnonLogin.status, 401);
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
