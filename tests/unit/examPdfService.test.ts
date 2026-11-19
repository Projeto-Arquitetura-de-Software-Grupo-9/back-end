import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TestExamRepository } from '../helpers/inMemoryRepositories';
import { ExamPdfService } from '../../src/services/ExamPdfService';
import { ExamRecordDTO } from '../../src/repositories/interfaces/IExamRepository';
import { ExamQuestionLayoutDTO } from '../../src/types/examPdf.dto';

function makeFixtures() {
  const questions: ExamQuestionLayoutDTO[] = Array.from({ length: 5 }, (_, i) => ({
    id: `q-${i + 1}`,
    originalQuestionId: `q-${i + 1}`,
    orderIndex: i + 1,
    statement: `Questão de teste número ${i + 1} sobre princípios constitucionais.`,
    discipline: 'Direito Constitucional',
    alternatives: [
      { id: `alt-${i}-a`, letter: 'A', text: 'Alternativa A' },
      { id: `alt-${i}-b`, letter: 'B', text: 'Alternativa B' },
      { id: `alt-${i}-c`, letter: 'C', text: 'Alternativa C' },
      { id: `alt-${i}-d`, letter: 'D', text: 'Alternativa D' },
      { id: `alt-${i}-e`, letter: 'E', text: 'Alternativa E' },
    ],
    correctAlternative: 'C',
    pointValue: 2.0,
  }));

  const exams: ExamRecordDTO[] = [
    {
      id: 'exam-catolica-01',
      code: '#DIR-01',
      title: 'AVALIAÇÃO ESCRITA 01',
      subtitle: '2026.1',
      institution: 'Católica SC Centro Universitário',
      department: 'Escola de Direito',
      course: 'Direito',
      discipline: 'Direito Constitucional',
      classGroup: 'Turma A',
      semester: '2026.1',
      date: '20/05/2026',
      duration: '2 horas',
      instructions: ['Marque apenas uma alternativa por questão.'],
      includeBoxNota: false,
      createdAt: new Date(),
    },
    {
      id: 'exam-single-page',
      code: '#DIR-02',
      title: 'AVALIAÇÃO CURTA',
      subtitle: '2026.1',
      institution: 'Católica SC Centro Universitário',
      department: 'Escola de Direito',
      course: 'Direito',
      discipline: 'Direito Constitucional',
      classGroup: 'Turma A',
      semester: '2026.1',
      date: '20/05/2026',
      duration: '1 hora',
      instructions: ['Caneta azul ou preta.'],
      includeBoxNota: false,
      createdAt: new Date(),
    },
  ];

  return new TestExamRepository(exams, questions);
}

describe('ExamPdfService Unit Tests (A4 Layout, Duplex & OMR Sheet)', () => {
  it('should generate A4 layout, permuted cadernos, binary PDF buffers, and duplex blank verso', async () => {
    const repo = makeFixtures();
    const service = new ExamPdfService(repo);

    const layoutA = await service.getExamLayout('exam-catolica-01', 'A');
    assert.equal(layoutA.pageSize, 'A4');
    assert.equal(layoutA.dimensionsMm.width, 210);
    assert.equal(layoutA.dimensionsMm.height, 297);
    assert.equal(layoutA.header.includeBoxNota, false);
    assert.equal(layoutA.pages.length, 2);

    const layoutB = await service.getExamLayout('exam-catolica-01', 'B');
    assert.notEqual(
      layoutB.pages[0].questions[0].originalQuestionId,
      layoutA.pages[0].questions[0].originalQuestionId
    );

    const pdfBuffer = await service.generatePdfBuffer({
      examId: 'exam-catolica-01',
      versionLetter: 'A',
      showAnswerKey: false,
      showQrCode: true,
      includeBoxNota: false,
    });
    assert.equal(pdfBuffer.subarray(0, 5).toString('ascii'), '%PDF-');

    const duplexSingle = await service.generateExamPdf({
      examId: 'exam-single-page',
      versionLetter: 'B',
      isDuplex: true,
    });
    assert.equal(duplexSingle.totalPages, 2);

    const duplexWithOmr = await service.generateExamPdf({
      examId: 'exam-catolica-01',
      versionLetter: 'A',
      isDuplex: true,
      includeAnswerSheet: true,
    });
    assert.equal(duplexWithOmr.totalPages, 4);
  });
});
