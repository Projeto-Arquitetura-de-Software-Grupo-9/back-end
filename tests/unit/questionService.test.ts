import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TestQuestionRepository } from '../helpers/inMemoryRepositories';
import { QuestionService } from '../../src/services/QuestionService';
import { QuestionDTO } from '../../src/types/question.dto';

function makeSeedQuestions(): QuestionDTO[] {
  return [
    {
      id: 'q-1024',
      teacherId: 'teacher-1',
      code: '#Q-1024',
      type: 'objetiva',
      discipline: 'Direito Constitucional',
      difficulty: 'Médio',
      topic: 'Direitos Fundamentais',
      tags: ['Constitucional', 'Domicílio'],
      statement: 'A casa é asilo inviolável do indivíduo (inviolabilidade de domicílio).',
      alternatives: [
        { id: 'a1', letter: 'A', text: 'Salvo em caso de flagrante delito.', isCorrect: true },
        { id: 'a2', letter: 'B', text: 'Sem exceções.', isCorrect: false },
      ],
      correctAlternative: 'A',
      gabaritoDisplay: 'ID-1',
      points: 1.0,
      maxScore: 1.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'q-1025',
      teacherId: 'teacher-1',
      code: '#Q-1025',
      type: 'discursiva',
      discipline: 'Direito Constitucional',
      difficulty: 'Difícil',
      topic: 'Separação de Poderes',
      tags: ['Constitucional', 'Discursiva'],
      statement: 'Discorra sobre o sistema de freios e contrapesos.',
      alternatives: [],
      correctAlternative: 'A',
      gabaritoDisplay: 'ID-1',
      points: 2.0,
      maxScore: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'q-1026',
      teacherId: 'teacher-1',
      code: '#Q-1026',
      type: 'objetiva',
      discipline: 'Cálculo I',
      difficulty: 'Fácil',
      topic: 'Limites',
      tags: ['Cálculo'],
      statement: 'Qual o limite de x quando x tende a 2?',
      alternatives: [
        { id: 'b1', letter: 'A', text: '1', isCorrect: false },
        { id: 'b2', letter: 'B', text: '2', isCorrect: true },
      ],
      correctAlternative: 'B',
      gabaritoDisplay: 'ID-2',
      points: 1.0,
      maxScore: 1.0,
      createdAt: new Date().toISOString(),
    },
  ];
}

describe('QuestionService Unit Tests (Full Question Bank Coverage)', () => {
  it('should list questions with filters', async () => {
    const repo = new TestQuestionRepository(makeSeedQuestions());
    const service = new QuestionService(repo);

    assert.equal((await service.listQuestions()).length, 3);
    assert.equal((await service.listQuestions({ discipline: 'Direito Constitucional' })).length, 2);
    assert.equal((await service.listQuestions({ difficulty: 'Médio' })).length, 1);
    assert.equal((await service.listQuestions({ type: 'discursiva' })).length, 1);
    assert.equal((await service.listQuestions({ search: 'domicílio' })).length, 1);
  });

  it('should validate mandatory fields when creating questions', async () => {
    const repo = new TestQuestionRepository(makeSeedQuestions());
    const service = new QuestionService(repo);

    await assert.rejects(
      () => service.createQuestion({ statement: '', discipline: 'Direito Civil', difficulty: 'Fácil' }),
      /O enunciado da questão é obrigatório/
    );
    await assert.rejects(
      () => service.createQuestion({ statement: 'Teste?', discipline: '', difficulty: 'Fácil' }),
      /A disciplina da questão é obrigatória/
    );
    await assert.rejects(
      () =>
        service.createQuestion({
          statement: 'Qual a capital?',
          discipline: 'Geografia',
          difficulty: 'Fácil',
          type: 'objetiva',
          alternatives: [{ letter: 'A', text: 'Brasília', isCorrect: true }],
        }),
      /Questões objetivas devem possuir no mínimo 2 alternativas/
    );

    const discursiva = await service.createQuestion({
      statement: 'Discorra sobre cláusula pétrea.',
      discipline: 'Direito Constitucional',
      difficulty: 'Difícil',
      type: 'discursiva',
      points: 2.0,
    });
    assert.equal(discursiva.type, 'discursiva');
  });

  it('should update and soft-delete questions cleanly', async () => {
    const repo = new TestQuestionRepository(makeSeedQuestions());
    const service = new QuestionService(repo);

    const updated = await service.updateQuestion('q-1024', { difficulty: 'Difícil', points: 3.0 });
    assert.equal(updated.difficulty, 'Difícil');

    await service.deleteQuestion('q-1024');
    await assert.rejects(() => service.getQuestionById('q-1024'), /not found/);
  });
});
