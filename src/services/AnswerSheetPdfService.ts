import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { z } from 'zod';

const letter = z.enum(['A', 'B', 'C', 'D', 'E']);
const sheetSchema = z.object({
  title: z.string().min(1).max(160), code: z.string().min(1).max(80),
  versionLetter: z.string().regex(/^[A-Z]$/),
  qrCodePayload: z.string().min(1).max(2000),
  questions: z.array(z.object({ orderIndex: z.number().int().min(1).max(999),
    letters: z.array(letter).min(2).max(5).refine(a => new Set(a).size === a.length),
  })).min(1).max(100).refine(q => new Set(q.map(x => x.orderIndex)).size === q.length),
});
const studentSchema = z.object({ name: z.string().min(1).max(160), registration: z.string().max(80) });
export const answerSheetSchema = sheetSchema.extend({
  sheets: z.array(sheetSchema.extend({ student: studentSchema.nullable().optional() })).min(1).max(200).optional(),
  isDuplex: z.boolean().default(false),
  copies: z.number().int().min(1).max(200).default(1),
  students: z.array(z.object({ name: z.string().min(1).max(160), registration: z.string().max(80) })).max(200).default([]),
});

/** Export only: does not create exams, assignments or QR identifiers. */
export async function generateAnswerSheets(input: z.infer<typeof answerSheetSchema>): Promise<Buffer> {
  const students = input.students.length ? input.students : Array.from({ length: input.copies }, () => null);
  const sheets = input.sheets || students.map(student => ({ ...input, student }));
  const qrBuffers = await Promise.all(sheets.map(sheet => QRCode.toBuffer(sheet.qrCodePayload, { margin: 4, width: 240, errorCorrectionLevel: 'M' })));
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 35, autoFirstPage: false });
    const chunks: Buffer[] = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try {
      for (const [sheetIndex, sheet] of sheets.entries()) {
        const student = sheet.student;
        doc.addPage();
        for (const x of [25, 562]) for (const y of [25, 804]) doc.rect(x, y, 8, 8).fill('black');
        doc.font('Helvetica-Bold').fontSize(14).text('FOLHA DE RESPOSTAS', 40, 43, { width: 410 });
        doc.fontSize(10).text(sheet.title, 40, 66, { width: 410, height: 40 });
        doc.font('Helvetica').fontSize(9).text(`${sheet.code} | Caderno ${sheet.versionLetter}`, 40, 110, { width: 410 });
        doc.image(qrBuffers[sheetIndex], 465, 40, { width: 85 });
        doc.text(`Nome: ${student?.name || '________________________________________________'}`, 40, 140, { width: 510, height: 28 });
        doc.text(`Matrícula: ${student?.registration || '________________________'}`, 40, 172);
        doc.text('Preencha uma alternativa por questão com caneta preta ou azul.', 40, 198);
        // At most 34 rows per column. All questions stay on a single A4 page.
        const cols = sheet.questions.length > 68 ? 3 : 2;
        const perCol = Math.ceil(sheet.questions.length / cols);
        sheet.questions.forEach((q, index) => {
          const x = 42 + Math.floor(index / perCol) * (510 / cols);
          const y = 230 + (index % perCol) * 16;
          doc.font('Helvetica-Bold').fontSize(8).text(String(q.orderIndex), x, y, { width: 25 });
          q.letters.forEach((l, i) => {
            const bx = x + 35 + i * 23;
            doc.circle(bx, y + 4, 6).lineWidth(0.7).stroke();
            doc.font('Helvetica').fontSize(6).text(l, bx - 3, y + 1, { width: 6, align: 'center', lineBreak: false });
          });
        });
        doc.fontSize(8).text('Correge | Folha em branco para preenchimento', 40, 797, { lineBreak: false });
        if (input.isDuplex) doc.addPage();
      }
      doc.end();
    } catch (error) { doc.end(); reject(error); }
  });
}
