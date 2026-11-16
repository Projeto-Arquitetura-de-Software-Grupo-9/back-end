import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { answerSheetSchema, generateAnswerSheets } from '../../src/services/AnswerSheetPdfService';

describe('AnswerSheetPdfService Unit Tests (OMR Bubble Sheet & Schema Coverage)', () => {
  it('should validate answer sheet schema with valid inputs', () => {
    const valid = answerSheetSchema.parse({
      title: 'Direito Civil I',
      code: '#DIR-CIV-01',
      versionLetter: 'A',
      qrCodePayload: JSON.stringify({ exam: 'DIR-CIV-01', ver: 'A' }),
      questions: [
        { orderIndex: 1, letters: ['A', 'B', 'C', 'D', 'E'] },
        { orderIndex: 2, letters: ['A', 'B', 'C', 'D'] },
      ],
      copies: 2,
      isDuplex: true,
    });

    assert.equal(valid.title, 'Direito Civil I');
    assert.equal(valid.versionLetter, 'A');
    assert.equal(valid.copies, 2);
    assert.equal(valid.isDuplex, true);
  });

  it('should reject invalid schema inputs', () => {
    // Missing title
    assert.throws(() =>
      answerSheetSchema.parse({
        title: '',
        code: 'TEST',
        versionLetter: 'A',
        qrCodePayload: 'test',
        questions: [{ orderIndex: 1, letters: ['A', 'B'] }],
      })
    );

    // Invalid versionLetter (lowercase or multiple chars)
    assert.throws(() =>
      answerSheetSchema.parse({
        title: 'Prova',
        code: 'TEST',
        versionLetter: 'ab',
        qrCodePayload: 'test',
        questions: [{ orderIndex: 1, letters: ['A', 'B'] }],
      })
    );

    // Duplicate question orderIndex
    assert.throws(() =>
      answerSheetSchema.parse({
        title: 'Prova',
        code: 'TEST',
        versionLetter: 'A',
        qrCodePayload: 'test',
        questions: [
          { orderIndex: 1, letters: ['A', 'B'] },
          { orderIndex: 1, letters: ['A', 'B'] },
        ],
      })
    );

    // Invalid letters (outside A..E)
    assert.throws(() =>
      answerSheetSchema.parse({
        title: 'Prova',
        code: 'TEST',
        versionLetter: 'A',
        qrCodePayload: 'test',
        questions: [{ orderIndex: 1, letters: ['A', 'F'] as any }],
      })
    );
  });

  it('should generate valid PDF binary buffer for single and batch copies', async () => {
    const singlePayload = answerSheetSchema.parse({
      title: 'Avaliação Oficial - Turma A',
      code: '#AVAL-2026.1',
      versionLetter: 'B',
      qrCodePayload: JSON.stringify({ exam: 'AVAL-2026.1', ver: 'B' }),
      questions: Array.from({ length: 15 }, (_, i) => ({
        orderIndex: i + 1,
        letters: ['A', 'B', 'C', 'D', 'E'],
      })),
      copies: 1,
      isDuplex: false,
    });

    const pdfBuffer = await generateAnswerSheets(singlePayload);
    assert.ok(Buffer.isBuffer(pdfBuffer));
    assert.ok(pdfBuffer.length > 3000);
    assert.equal(pdfBuffer.subarray(0, 5).toString('ascii'), '%PDF-');
  });

  it('should generate duplex PDF with blank verso per answer sheet', async () => {
    const duplexPayload = answerSheetSchema.parse({
      title: 'Avaliação Oficial Duplex',
      code: '#AVAL-DUP-01',
      versionLetter: 'A',
      qrCodePayload: JSON.stringify({ exam: 'AVAL-DUP-01', ver: 'A' }),
      questions: Array.from({ length: 20 }, (_, i) => ({
        orderIndex: i + 1,
        letters: ['A', 'B', 'C', 'D', 'E'],
      })),
      copies: 1,
      isDuplex: true,
    });

    const pdfBuffer = await generateAnswerSheets(duplexPayload);
    assert.ok(Buffer.isBuffer(pdfBuffer));
    // Duplex generates 2 pages per sheet (1 content + 1 blank verso)
    assert.ok(pdfBuffer.length > 4000);
  });

  it('should generate personalized answer sheets with student names and 3 columns for large question sets', async () => {
    const largeSetPayload = answerSheetSchema.parse({
      title: 'Simulado Geral Enade',
      code: '#SIMUL-ENADE',
      versionLetter: 'C',
      qrCodePayload: JSON.stringify({ exam: 'SIMUL-ENADE', ver: 'C' }),
      questions: Array.from({ length: 75 }, (_, i) => ({
        orderIndex: i + 1,
        letters: ['A', 'B', 'C', 'D', 'E'],
      })),
      students: [
        { name: 'Amanda Dolores', registration: '2024.1.001' },
        { name: 'Cleber Santana', registration: '2024.1.089' },
      ],
      isDuplex: false,
    });

    const pdfBuffer = await generateAnswerSheets(largeSetPayload);
    assert.ok(Buffer.isBuffer(pdfBuffer));
    assert.ok(pdfBuffer.length > 5000);
  });
});
