import ExcelJS from 'exceljs';

export interface ReportInput {
  id: string;
  title: string;
  versions: {
    id: string;
    versionLetter: string;
    answerKey: unknown;
    correcoes: {
      id: string;
      idAluno: string | null;
      nomeManuscrito: string | null;
      matriculaManuscrita: string | null;
      notaTotal: number;
      respostasLidas: unknown;
      dataConfirmacao: Date;
      student: { name: string; registration: string } | null;
    }[];
  }[];
}

const letters = ['A', 'B', 'C', 'D', 'E'];
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

/** Read-only projection. Grades remain those confirmed by the correction module. */
export function buildReport(exam: ReportInput) {
  // Retakes/duplicate submissions: use the latest confirmed correction per identified student.
  const all = exam.versions.flatMap(v => v.correcoes.map(c => ({ ...c, versionId: v.id })))
    .sort((a, b) => b.dataConfirmacao.getTime() - a.dataConfirmacao.getTime() || a.id.localeCompare(b.id));
  const seen = new Set<string>();
  const selected = all.filter(c => {
    const key = c.idAluno ? `student:${c.idAluno}` : `correction:${c.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const versions = exam.versions.map(v => {
    const key = record(v.answerKey);
    const questions = Object.keys(key).filter(n => /^[1-9]\d*$/.test(n) && letters.includes(String(key[n])))
      .map(Number).sort((a, b) => a - b);
    if (questions.length !== Object.keys(key).length || (!questions.length && v.correcoes.length)) {
      throw new Error('Gabarito persistido ausente ou inválido.');
    }
    const rows = selected.filter(c => c.versionId === v.id).map(c => {
      const read = record(c.respostasLidas);
      return {
        id: c.id, studentId: c.idAluno,
        name: c.student?.name || c.nomeManuscrito || 'Sem identificação',
        registration: c.student?.registration || c.matriculaManuscrita || '',
        pending: !c.idAluno, score: c.notaTotal, confirmedAt: c.dataConfirmacao.toISOString(),
        answers: questions.map(number => {
          const raw = String(read[number] ?? '').trim().toUpperCase();
          const chosen = letters.includes(raw) ? raw : null;
          return { number, chosen, correct: String(key[number]), isCorrect: chosen === key[number] };
        }),
      };
    });
    const identified = rows.filter(r => !r.pending);
    return {
      id: v.id, letter: v.versionLetter, rows,
      questions: questions.map(number => {
        const answers = identified.map(r => r.answers.find(a => a.number === number)!);
        return {
          number, correct: String(key[number]), total: answers.length,
          correctCount: answers.filter(a => a.isCorrect).length,
          blankCount: answers.filter(a => a.chosen === null).length,
          distribution: Object.fromEntries(letters.map(l => [l, answers.filter(a => a.chosen === l).length])),
        };
      }),
    };
  });
  const scores = versions.flatMap(v => v.rows.filter(r => !r.pending).map(r => r.score)).sort((a, b) => a - b);
  const n = scores.length;
  const average = n ? scores.reduce((a, b) => a + b, 0) / n : null;
  return {
    examId: exam.id, title: exam.title, versions,
    pendingCount: selected.filter(c => !c.idAluno).length,
    metrics: {
      count: n, average,
      median: n ? (scores[Math.floor((n - 1) / 2)] + scores[Math.floor(n / 2)]) / 2 : null,
      highest: n ? scores[n - 1] : null, lowest: n ? scores[0] : null,
      standardDeviation: average === null ? null : Math.sqrt(scores.reduce((sum, x) => sum + (x - average) ** 2, 0) / n),
    },
  };
}

export type ExamResultsReport = ReturnType<typeof buildReport>;

export async function exportReport(report: ExamResultsReport) {
  const book = new ExcelJS.Workbook();
  const summary = book.addWorksheet('Resumo');
  summary.addRows([['Prova', report.title], ['Alunos identificados', report.metrics.count],
    ['Atribuições pendentes', report.pendingCount], ['Média', report.metrics.average],
    ['Mediana', report.metrics.median], ['Desvio padrão populacional', report.metrics.standardDeviation],
    ['Maior nota', report.metrics.highest], ['Menor nota', report.metrics.lowest],
    ['Critério', 'Última correção por aluno; notas confirmadas pelo módulo de correção. Pendentes fora das estatísticas.']]);
  report.versions.forEach((v, index) => {
    const sheet = book.addWorksheet(`Caderno ${index + 1}`);
    sheet.addRow([`Caderno ${v.letter}`]);
    sheet.addRow(['Aluno', 'Matrícula', 'Situação', 'Nota', 'Confirmado em', ...v.questions.map(q => `Q${q.number}`)]);
    sheet.addRow(['Gabarito', '', '', '', '', ...v.questions.map(q => q.correct)]);
    for (const row of v.rows) {
      const excelRow = sheet.addRow([row.name, row.registration, row.pending ? 'Atribuição pendente' : 'Identificado',
        row.score, row.confirmedAt, ...row.answers.map(a => a.chosen || 'Em branco/inválida')]);
      row.answers.forEach((a, i) => {
        excelRow.getCell(6 + i).fill = { type: 'pattern', pattern: 'solid',
          fgColor: { argb: a.chosen === null ? 'FFE2E8F0' : a.isCorrect ? 'FFD1FAE5' : 'FFFFE4E6' } };
      });
    }
    sheet.views = [{ state: 'frozen', ySplit: 3, xSplit: 2 }];
    sheet.getColumn(4).numFmt = '0.00';
    const stats = book.addWorksheet(`Estatísticas ${index + 1}`);
    stats.addRow([`Caderno ${v.letter} — apenas alunos identificados`]);
    stats.addRow(['Questão', 'Gabarito', 'Alunos', 'Acertos', 'Em branco/inválida', ...letters]);
    v.questions.forEach(q => stats.addRow([q.number, q.correct, q.total, q.correctCount, q.blankCount, ...letters.map(l => q.distribution[l])]));
  });
  book.eachSheet(s => {
    s.getRow(1).font = { bold: true };
    s.columns.forEach(c => { c.width = 24; });
  });
  return book.xlsx.writeBuffer();
}
