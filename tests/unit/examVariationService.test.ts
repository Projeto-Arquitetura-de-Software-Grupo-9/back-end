import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TestExamVariationRepository } from '../helpers/inMemoryRepositories';
import { ExamVariationService } from '../../src/services/ExamVariationService';
import { VariationQuestionDTO } from '../../src/types/examVariation.dto';

function makeVariationQuestions(): VariationQuestionDTO[] {
  return [
    {
      originalQuestionId: 'q-101',
      orderIndex: 1,
      statement: 'A Constituição Federal de 1988 estabelece como fundamento:',
      discipline: 'Direito Constitucional',
      alternatives: [
        { id: '1a', letter: 'A', text: 'Opção incorreta 1' },
        { id: '1b', letter: 'B', text: 'O pluripartidarismo e a soberania nacional.' },
        { id: '1c', letter: 'C', text: 'Opção incorreta 2' },
        { id: '1d', letter: 'D', text: 'Opção incorreta 3' },
      ],
      correctAlternative: 'B',
    },
    {
      originalQuestionId: 'q-102',
      orderIndex: 2,
      statement: 'Sobre o controle de constitucionalidade:',
      discipline: 'Direito Constitucional',
      alternatives: [
        { id: '2a', letter: 'A', text: 'Controle concentrado pelo STF.' },
        { id: '2b', letter: 'B', text: 'Alternativa incorreta B' },
        { id: '2c', letter: 'C', text: 'Alternativa incorreta C' },
        { id: '2d', letter: 'D', text: 'Alternativa incorreta D' },
      ],
      correctAlternative: 'A',
    },
    {
      originalQuestionId: 'q-103',
      orderIndex: 3,
      statement: 'Acerca das cláusulas pétreas:',
      discipline: 'Direito Constitucional',
      alternatives: [
        { id: '3a', letter: 'A', text: 'Alternativa incorreta A' },
        { id: '3b', letter: 'B', text: 'Alternativa incorreta B' },
        { id: '3c', letter: 'C', text: 'Forma federativa de Estado.' },
        { id: '3d', letter: 'D', text: 'Alternativa incorreta D' },
      ],
      correctAlternative: 'C',
    },
    {
      originalQuestionId: 'q-104',
      orderIndex: 4,
      statement: 'Sobre direitos fundamentais:',
      discipline: 'Direito Constitucional',
      alternatives: [
        { id: '4a', letter: 'A', text: 'Alternativa incorreta A' },
        { id: '4b', letter: 'B', text: 'Alternativa incorreta B' },
        { id: '4c', letter: 'C', text: 'Alternativa incorreta C' },
        { id: '4d', letter: 'D', text: 'Aplicação imediata das normas.' },
      ],
      correctAlternative: 'D',
    },
  ];
}

describe('ExamVariationService Unit Tests', () => {
  it('should permute questions and alternatives while preserving semantic answer key and random distribution', async () => {
    const repo = new TestExamVariationRepository(makeVariationQuestions());
    const service = new ExamVariationService(repo);

    const result = await service.generateVariations({
      examId: 'exam-var-01',
      numberOfVersions: 4,
      shuffleQuestions: true,
      shuffleAlternatives: true,
      strategy: 'FISHER_YATES',
    });

    assert.equal(result.versions.length, 4);
    assert.notDeepEqual(
      result.versions[0].questions.map((q) => q.originalQuestionId),
      result.versions[1].questions.map((q) => q.originalQuestionId)
    );

    const expectedCorrectText = 'O pluripartidarismo e a soberania nacional.';
    for (const version of result.versions) {
      const q = version.questions.find((item) => item.originalQuestionId === 'q-101')!;
      const correctLetter = version.answerKey[q.orderIndex];
      const alt = q.alternatives.find((a) => a.letter === correctLetter)!;
      assert.equal(alt.text, expectedCorrectText);
    }

    assert.equal(result.crossAnswerKeyMatrix.length, 4);

    const sampleStudents = [
      { id: 's1', name: 'Estudante 1', registration: '2026.1.001' },
      { id: 's2', name: 'Estudante 2', registration: '2026.1.002' },
      { id: 's3', name: 'Estudante 3', registration: '2026.1.003' },
      { id: 's4', name: 'Estudante 4', registration: '2026.1.004' },
    ];
    const distribution = await service.distributeStudents('exam-var-01', sampleStudents);
    assert.equal(distribution.length, 4);
    assert.equal(new Set(distribution.map((d) => d.assignedVersion)).size, 4);
  });
});
