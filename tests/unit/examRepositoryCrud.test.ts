import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MockExamRepository } from '../../src/repositories/mock/MockExamRepository';
import { MockProfessorRepository } from '../../src/repositories/mock/MockProfessorRepository';
import { ProfessorController } from '../../src/controllers/ProfessorController';
import { ExamVariationService } from '../../src/services/ExamVariationService';
import { MockExamVariationRepository } from '../../src/repositories/mock/MockExamVariationRepository';

describe('Exam Repository CRUD & Hexagonal Architecture Tests (Item 8 & Item 2)', () => {
  it('should list exams and filter by disciplinaId', async () => {
    const repo = new MockExamRepository();
    const all = await repo.listExams();
    assert.ok(all.length >= 2);

    const filtered = await repo.listExams('disc-mock-1');
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, 'exam-catolica-01');
  });

  it('should create, update, and delete an exam cleanly in repository', async () => {
    const repo = new MockExamRepository();
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
      instructions: ['Instrução 1', 'Instrução 2'],
      includeBoxNota: false,
    });

    assert.ok(created.id);
    assert.equal(created.title, 'Avaliação de Direito Penal');
    assert.equal(created.includeBoxNota, false);

    // Verify findExamById
    const found = await repo.findExamById(created.id);
    assert.ok(found);
    assert.equal(found?.title, 'Avaliação de Direito Penal');

    // Verify updateExam
    const updated = await repo.updateExam(created.id, {
      title: 'Avaliação de Direito Penal - Atualizada',
    });
    assert.equal(updated.title, 'Avaliação de Direito Penal - Atualizada');

    // Verify deleteExam
    const deleted = await repo.deleteExam(created.id);
    assert.equal(deleted, true);

    const check = await repo.findExamById(created.id);
    assert.equal(check, null);
  });

  it('should support question permutation for cadernos up to 26 letters (A..Z)', async () => {
    const repo = new MockExamRepository();
    const questionsA = await repo.getExamQuestions('exam-default', 'A');
    const questionsB = await repo.getExamQuestions('exam-default', 'B');
    const questionsZ = await repo.getExamQuestions('exam-default', 'Z');

    assert.equal(questionsA.length, 5);
    assert.equal(questionsB.length, 5);
    assert.equal(questionsZ.length, 5);
    assert.notDeepEqual(questionsA.map((q) => q.id), questionsB.map((q) => q.id));
  });

  it('should map crossAnswerKeyMatrix for all requested versions dynamically (A..Z)', async () => {
    const varRepo = new MockExamVariationRepository();
    const service = new ExamVariationService(varRepo);

    const result = await service.generateVariations({
      examId: 'exam-default',
      numberOfVersions: 5, // A, B, C, D, E
      shuffleQuestions: true,
      shuffleAlternatives: true,
      strategy: 'FISHER_YATES',
    });

    assert.equal(result.versions.length, 5);
    assert.equal(result.versions[4].versionLetter, 'E');

    // Verify dynamic cross mapping contains E
    const entry = result.crossAnswerKeyMatrix[0];
    assert.ok(entry.orderIndexA !== undefined);
    assert.ok(entry.orderIndexB !== undefined);
    assert.ok(entry.orderIndexC !== undefined);
    assert.ok(entry.orderIndexD !== undefined);
    assert.ok(entry.orderIndexE !== undefined);
    assert.ok(entry.correctLetterE !== undefined);
  });
});

describe('Professor Controller Security & Password Hashing Tests (Item 3)', () => {
  it('should hash passwords with bcrypt on creation and issue valid signed JWT on login', async () => {
    const repo = new MockProfessorRepository();
    const controller = new ProfessorController(repo);

    let createStatus = 0;
    let createBody: any = null;
    const reqCreate: any = {
      body: {
        nomeCompleto: 'Dr. Roberto Santos',
        email: 'roberto.santos@catolicasc.edu.br',
        senha: 'SenhaForte123!',
      },
    };
    const resCreate: any = {
      status: (code: number) => {
        createStatus = code;
        return {
          json: (data: any) => {
            createBody = data;
          },
        };
      },
    };

    await controller.create(reqCreate, resCreate);
    assert.equal(createStatus, 201);
    assert.equal(createBody.success, true);

    // Verify stored password in repo is bcrypt hash
    const stored = await repo.findByEmail('roberto.santos@catolicasc.edu.br');
    assert.ok(stored);
    assert.ok(stored.senhaHash.startsWith('$2'));
    assert.notEqual(stored.senhaHash, 'SenhaForte123!');

    // Test Login with wrong password
    let loginStatus = 0;
    let loginBody: any = null;
    const reqWrongLogin: any = {
      body: {
        email: 'roberto.santos@catolicasc.edu.br',
        senha: 'SenhaErrada',
      },
    };
    const resWrongLogin: any = {
      status: (code: number) => {
        loginStatus = code;
        return {
          json: (data: any) => {
            loginBody = data;
          },
        };
      },
    };

    await controller.login(reqWrongLogin, resWrongLogin);
    assert.equal(loginStatus, 401);
    assert.equal(loginBody.success, false);

    // Test Login with correct password
    const reqRightLogin: any = {
      body: {
        email: 'roberto.santos@catolicasc.edu.br',
        senha: 'SenhaForte123!',
      },
    };
    const resRightLogin: any = {
      status: (code: number) => {
        loginStatus = code;
        return {
          json: (data: any) => {
            loginBody = data;
          },
        };
      },
    };

    await controller.login(reqRightLogin, resRightLogin);
    assert.equal(loginStatus, 200);
    assert.equal(loginBody.success, true);
    assert.ok(loginBody.data.token);

    // Verify JWT payload
    const decoded = jwt.decode(loginBody.data.token) as any;
    assert.equal(decoded.email, 'roberto.santos@catolicasc.edu.br');
    assert.equal(decoded.nomeCompleto, 'Dr. Roberto Santos');
  });
});
