import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MockQuestionRepository } from '../../src/repositories/mock/MockQuestionRepository';
import { QuestionService } from '../../src/services/QuestionService';

describe('QuestionService Unit Tests (Full Question Bank Coverage)', () => {
  it('should list questions without filters and with various filter criteria', async () => {
    const repo = new MockQuestionRepository();
    const service = new QuestionService(repo);

    const all = await service.listQuestions();
    assert.ok(all.length >= 3, 'Should return at least 3 initial questions');

    // Filter by discipline
    const byDiscipline = await service.listQuestions({ discipline: 'Direito Constitucional' });
    assert.ok(byDiscipline.length > 0);
    byDiscipline.forEach((q) => assert.equal(q.discipline, 'Direito Constitucional'));

    // Filter by difficulty
    const byDifficulty = await service.listQuestions({ difficulty: 'Médio' });
    assert.ok(byDifficulty.length > 0);
    byDifficulty.forEach((q) => assert.equal(q.difficulty, 'Médio'));

    // Filter by type
    const byType = await service.listQuestions({ type: 'discursiva' });
    assert.ok(byType.length > 0);
    byType.forEach((q) => assert.equal(q.type, 'discursiva'));

    // Filter by search
    const bySearch = await service.listQuestions({ search: 'domicílio' });
    assert.ok(bySearch.length > 0);
    assert.ok(bySearch.some((q) => q.statement.includes('domicílio')));
  });

  it('should get question by id and throw if not found', async () => {
    const repo = new MockQuestionRepository();
    const service = new QuestionService(repo);

    const question = await service.getQuestionById('q-1024');
    assert.equal(question.id, 'q-1024');
    assert.equal(question.type, 'objetiva');

    await assert.rejects(
      () => service.getQuestionById('non-existent-question'),
      /Question with id "non-existent-question" not found/
    );
  });

  it('should validate mandatory fields when creating a question', async () => {
    const repo = new MockQuestionRepository();
    const service = new QuestionService(repo);

    // Missing statement
    await assert.rejects(
      () => service.createQuestion({
        statement: '',
        discipline: 'Direito Civil',
        difficulty: 'Fácil',
      }),
      /O enunciado da questão é obrigatório/
    );

    // Missing discipline
    await assert.rejects(
      () => service.createQuestion({
        statement: 'Qual o prazo prescricional?',
        discipline: '',
        difficulty: 'Fácil',
      }),
      /A disciplina da questão é obrigatória/
    );

    // Missing difficulty
    await assert.rejects(
      () => service.createQuestion({
        statement: 'Qual o prazo prescricional?',
        discipline: 'Direito Civil',
        difficulty: '' as any,
      }),
      /O nível de dificuldade da questão é obrigatório/
    );

    // Objective question with less than 2 alternatives
    await assert.rejects(
      () => service.createQuestion({
        statement: 'Qual a capital do Brasil?',
        discipline: 'Geografia',
        difficulty: 'Fácil',
        type: 'objetiva',
        alternatives: [{ letter: 'A', text: 'Brasília', isCorrect: true }],
      }),
      /Questões objetivas devem possuir no mínimo 2 alternativas/
    );

    // Objective question with no alternatives
    await assert.rejects(
      () => service.createQuestion({
        statement: 'Qual a capital do Brasil?',
        discipline: 'Geografia',
        difficulty: 'Fácil',
        type: 'objetiva',
      }),
      /Questões objetivas devem possuir no mínimo 2 alternativas/
    );

    // Discursiva question is valid without alternatives
    const discursiva = await service.createQuestion({
      statement: 'Discorra sobre a cláusula pétrea.',
      discipline: 'Direito Constitucional',
      difficulty: 'Difícil',
      type: 'discursiva',
      points: 2.0,
    });
    assert.ok(discursiva.id);
    assert.equal(discursiva.type, 'discursiva');

    // Valid objective question
    const objetiva = await service.createQuestion({
      statement: 'Qual o prazo da ação de alimentos?',
      discipline: 'Direito Civil',
      difficulty: 'Médio',
      type: 'objetiva',
      alternatives: [
        { letter: 'A', text: '1 ano', isCorrect: false },
        { letter: 'B', text: '2 anos', isCorrect: true },
        { letter: 'C', text: '3 anos', isCorrect: false },
      ],
      correctAlternative: 'B',
      points: 1.5,
    });
    assert.ok(objetiva.id);
    assert.equal(objetiva.alternatives.length, 3);
    assert.equal(objetiva.correctAlternative, 'B');
  });

  it('should update question and throw if not found', async () => {
    const repo = new MockQuestionRepository();
    const service = new QuestionService(repo);

    const updated = await service.updateQuestion('q-1024', {
      difficulty: 'Difícil',
      points: 3.0,
    });
    assert.equal(updated.difficulty, 'Difícil');
    assert.equal(updated.points, 3.0);

    await assert.rejects(
      () => service.updateQuestion('non-existent-question', { points: 5.0 }),
      /Question with id "non-existent-question" not found/
    );
  });

  it('should delete question and throw if not found', async () => {
    const repo = new MockQuestionRepository();
    const service = new QuestionService(repo);

    await service.deleteQuestion('q-1024');
    await assert.rejects(
      () => service.getQuestionById('q-1024'),
      /Question with id "q-1024" not found/
    );

    await assert.rejects(
      () => service.deleteQuestion('non-existent-question'),
      /Question with id "non-existent-question" not found/
    );
  });

  it('should return available tags and disciplines', async () => {
    const repo = new MockQuestionRepository();
    const service = new QuestionService(repo);

    const tags = await service.getAvailableTags();
    assert.ok(Array.isArray(tags));
    assert.ok(tags.length > 0);

    const disciplines = await service.getAvailableDisciplines();
    assert.ok(Array.isArray(disciplines));
    assert.ok(disciplines.includes('Direito Constitucional'));
  });
});
