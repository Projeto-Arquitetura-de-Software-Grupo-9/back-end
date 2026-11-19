import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import express from 'express';
import { buildReport, exportReport, ReportInput } from '../src/services/ReportService';
import { answerSheetSchema, generateAnswerSheets } from '../src/services/AnswerSheetPdfService';
import { createReportRouter } from '../src/routes/reportRoutes';
import { createAnswerSheetRouter } from '../src/routes/answerSheetRoutes';
import { getActiveDataSource } from '../src/repositories';
import { ExamPdfService } from '../src/services/ExamPdfService';
import { createExamExportRouter } from '../src/routes/examExportRoutes';
import { TestExamRepository } from './helpers/inMemoryRepositories';

const correction = (id: string, student: string | null, score: number, answers: Record<string, string>, date = '2026-10-28') => ({
  id, idAluno: student, nomeManuscrito: null, matriculaManuscrita: null, notaTotal: score,
  respostasLidas: answers, dataConfirmacao: new Date(date),
  student: student ? { name: `Aluno ${student}`, registration: '00123' } : null,
});
const fixture: ReportInput = { id: 'exam-test', title: 'Prova de teste', versions: [
  { id: 'va', versionLetter: 'A', answerKey: { 1: 'A', 2: 'C' }, correcoes: [
    correction('old', 's1', 2, { 1: 'B' }), correction('new', 's1', 8, { 1: 'A', 2: '' }, '2026-10-29'),
    correction('pending', null, 10, { 1: 'A', 2: 'C' }),
  ] },
  { id: 'vb', versionLetter: 'B', answerKey: { 1: 'D', 2: 'B' }, correcoes: [correction('b', 's2', 6, { 1: 'D', 2: 'X' })] },
] };

function makeExamRepo() {
  return new TestExamRepository(
    [
      {
        id: 'exam-catolica-01',
        code: '#DIR-01',
        title: 'Avaliação Teste',
        subtitle: '2026.1',
        institution: 'Católica SC',
        department: 'Direito',
        course: 'Direito',
        discipline: 'Direito Constitucional',
        classGroup: 'Turma A',
        semester: '2026.1',
        date: '20/10/2026',
        duration: '2 horas',
        instructions: ['Instrução padrão'],
        includeBoxNota: false,
        createdAt: new Date(),
      },
    ],
    Array.from({ length: 5 }, (_, i) => ({
      id: `q-${i + 1}`,
      originalQuestionId: `q-${i + 1}`,
      orderIndex: i + 1,
      statement: `Enunciado ${i + 1}`,
      discipline: 'Direito Constitucional',
      alternatives: [
        { id: `a-${i}-1`, letter: 'A', text: 'Alt A' },
        { id: `a-${i}-2`, letter: 'B', text: 'Alt B' },
        { id: `a-${i}-3`, letter: 'C', text: 'Alt C' },
        { id: `a-${i}-4`, letter: 'D', text: 'Alt D' },
      ],
      correctAlternative: 'A',
      pointValue: 2.0,
    }))
  );
}

test('latest correction, version-specific keys, blank answers and pending identities', () => {
  const r = buildReport(fixture);
  assert.equal(r.metrics.count, 2); assert.equal(r.metrics.average, 7);
  assert.equal(r.metrics.median, 7); assert.equal(r.metrics.standardDeviation, 1);
  assert.equal(r.pendingCount, 1);
  assert.equal(r.versions[0].rows.length, 2);
  assert.equal(r.versions[0].questions[1].blankCount, 1);
  assert.equal(r.versions[1].questions[0].correctCount, 1);
  assert.equal(r.versions[1].questions[1].blankCount, 1);
  assert.equal(r.versions[0].questions[0].total, 1);
});

test('empty reports have null statistics and invalid keys cannot appear healthy', () => {
  const r = buildReport({ ...fixture, versions: [] });
  assert.equal(r.metrics.average, null); assert.equal(r.metrics.median, null);
  assert.throws(() => buildReport({ ...fixture, versions: [{ ...fixture.versions[0], answerKey: {} }] }));
});

test('xlsx can be reopened and preserves grades, matrices, database origin and registration as text', async () => {
  const bytes = await exportReport(buildReport(fixture));
  const book = new ExcelJS.Workbook(); await book.xlsx.load(bytes);
  assert.equal(book.worksheets.length, 5);
  assert.equal(book.getWorksheet('Resumo')!.getCell('B4').value, 7);
  assert.equal(book.getWorksheet('Resumo')!.getCell('B10').value, 'Banco de dados');
  const sheet = book.getWorksheet('Caderno 1')!;
  assert.equal(sheet.getCell('B4').value, '00123');
  assert.equal(sheet.getCell('D4').value, 8);
  assert.equal(sheet.getCell('G4').value, 'Em branco/inválida');
  assert.deepEqual(sheet.getCell('F4').fill, { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } });
});

const sheet = (count: number) => answerSheetSchema.parse({ title: 'Avaliação de teste', code: 'TEST-01',
  versionLetter: 'B', qrCodePayload: JSON.stringify({ examId: 'exam-test', ver: 'B' }),
  questions: Array.from({ length: count }, (_, i) => ({ orderIndex: i + 1, letters: ['A', 'B', 'C', 'D', 'E'] })), copies: 2,
});

test('PDF export handles 1 and 100 questions, copies and personalized batches', async () => {
  for (const n of [1, 100]) {
    const bytes = await generateAnswerSheets(sheet(n));
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
    assert.equal((bytes.toString('latin1').match(/\/Type \/Page\b/g) || []).length, 2);
  }
  const bytes = await generateAnswerSheets({ ...sheet(10), students: [{ name: 'Estudante', registration: '00001' }] });
  assert.equal((bytes.toString('latin1').match(/\/Type \/Page\b/g) || []).length, 1);
  assert.equal(answerSheetSchema.safeParse({ ...sheet(1), copies: 201 }).success, false);
  assert.equal(answerSheetSchema.safeParse({ ...sheet(1), questions: [] }).success, false);
});

test('HTTP report/download routes return real files and meaningful missing-data responses', async () => {
  assert.equal(getActiveDataSource(), 'database');
  const app = express(); app.use(express.json());
  app.use('/reports', createReportRouter(async id => id === fixture.id ? fixture : null, async () => [{ id: fixture.id, title: fixture.title }]));
  app.use('/answer-sheets', createAnswerSheetRouter());
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address() as { port: number };
  const base = `http://127.0.0.1:${address.port}`;
  try {
    const json = await fetch(`${base}/reports/exam-test/results`);
    assert.equal(json.status, 200); assert.equal((await json.json()).data.metrics.average, 7);
    const xlsx = await fetch(`${base}/reports/exam-test/results?format=xlsx`);
    assert.match(xlsx.headers.get('content-type')!, /spreadsheetml/);
    assert.equal(Buffer.from(await xlsx.arrayBuffer()).subarray(0, 2).toString(), 'PK');
    assert.equal((await fetch(`${base}/reports/missing/results`)).status, 404);
    assert.equal((await fetch(`${base}/reports/exam-test/results?format=csv`)).status, 400);
    const pdf = await fetch(`${base}/answer-sheets/pdf`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sheet(20)) });
    assert.equal(pdf.status, 200); assert.match(pdf.headers.get('content-type')!, /application\/pdf/);
    assert.equal((await fetch(`${base}/answer-sheets/pdf`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 400);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('current exam PDFs have the declared physical page count', async () => {
  const service = new ExamPdfService(makeExamRepo());
  for (const options of [
    { includeAnswerSheet: false, isDuplex: false },
    { includeAnswerSheet: true, isDuplex: false },
    { includeAnswerSheet: true, isDuplex: true },
    { answerSheetOnly: true, isDuplex: false },
  ]) {
    const result = await service.generateExamPdf({ examId: 'exam-catolica-01', versionLetter: 'A', ...options });
    const buffer = Buffer.from(result.pdfBase64, 'base64');
    assert.equal((buffer.toString('latin1').match(/\/Type \/Page\b/g) || []).length, result.totalPages);
  }
});

test('mixed-version nominal PDF batch preserves per-sheet versions and clean duplex backs', async () => {
  const first = { ...sheet(3), versionLetter: 'A', student: { name: 'Aluno A', registration: '001' } };
  const last = { ...sheet(100), versionLetter: 'Z', qrCodePayload: 'version-Z', student: { name: 'Aluno Z', registration: '002' } };
  const payload = answerSheetSchema.parse({ ...sheet(3), sheets: [first, last], isDuplex: true });
  const pdf = await generateAnswerSheets(payload);
  assert.equal((pdf.toString('latin1').match(/\/Type \/Page\b/g) || []).length, 4);
  assert.equal(answerSheetSchema.safeParse({ ...sheet(1), versionLetter: 'AA' }).success, false);
});

test('preview PDF exports a locally supplied exam without persistence', async () => {
  const app = express(); app.use(express.json()); app.use('/export', createExamExportRouter());
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/export/pdf`;
  const layout = await makeExamRepo().getExamLayout('exam-catolica-01', 'A');
  try {
    const response = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      examId: 'local-not-saved', versionLetter: 'Z', header: layout!.header, pages: layout!.pages.map(p => ({ questions: p.questions })),
      isDuplex: false, includeAnswerSheet: true,
    }) });
    assert.equal(response.status, 200);
    const pdf = Buffer.from(await response.arrayBuffer());
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    assert.equal((pdf.toString('latin1').match(/\/Type \/Page\b/g) || []).length, 3);
    assert.equal((await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 400);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
