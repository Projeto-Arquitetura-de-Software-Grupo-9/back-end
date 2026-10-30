import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { IExamRepository } from '../repositories/interfaces/IExamRepository';
import {
  ExamLayoutDTO,
  ExamPdfResultDTO,
  ExamQuestionLayoutDTO,
  ExamVersionLetter,
  GenerateExamPdfRequestDTO,
} from '../types/examPdf.dto';
import { IExamPdfService } from './interfaces/IExamPdfService';

export class ExamPdfService implements IExamPdfService {
  constructor(private examRepository: IExamRepository) {}

  async getExamLayout(examId: string, versionLetter: ExamVersionLetter = 'A'): Promise<ExamLayoutDTO> {
    const layout = await this.examRepository.getExamLayout(examId, versionLetter);
    if (!layout) {
      throw new Error(`Exam not found with id: ${examId}`);
    }
    return layout;
  }

  async generatePdfBuffer(request: GenerateExamPdfRequestDTO): Promise<Buffer> {
    const versionLetter = request.versionLetter || 'A';
    const layout = await this.getExamLayout(request.examId, versionLetter);

    return new Promise<Buffer>(async (resolve, reject) => {
      try {
        // A4 Paper: 595.28 x 841.89 points
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 40,
            bottom: 40,
            left: 45,
            right: 45,
          },
          autoFirstPage: false,
          bufferPages: true,
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        const showAnswerKey = request.showAnswerKey ?? false;
        const showQrCode = request.showQrCode ?? true;
        const includeBoxNota = request.includeBoxNota ?? layout.header.includeBoxNota;
        const isDuplex = request.isDuplex ?? false;
        const answerSheetOnly = request.answerSheetOnly ?? false;
        const includeAnswerSheet = answerSheetOnly ? true : (request.includeAnswerSheet ?? false);

        const questionPageCount = answerSheetOnly ? 0 : layout.pages.length;
        const needsBookletBlankVerso = isDuplex && questionPageCount % 2 !== 0;
        let totalPages = questionPageCount;
        if (includeAnswerSheet) {
          if (needsBookletBlankVerso) totalPages += 1;
          totalPages += 1; // Answer sheet
          if (isDuplex) totalPages += 1; // Answer sheet blank verso
        } else {
          if (needsBookletBlankVerso) totalPages += 1;
        }

        // Render Page by Page
        for (let i = 0; i < questionPageCount; i++) {
          const page = layout.pages[i];
          doc.addPage();

          const pageWidth = doc.page.width;
          const isOddPage = (i + 1) % 2 !== 0;
          const leftMargin = isDuplex ? (isOddPage ? 52 : 38) : 45;
          const rightMargin = isDuplex ? (isOddPage ? 38 : 52) : 45;
          const contentWidth = pageWidth - (leftMargin + rightMargin);

          if (page.isFirstPage) {
            // Reserve header space for QR and optional grade box instead of covering student fields.
            const headerTextWidth = contentWidth - (includeBoxNota && showQrCode ? 185 : 110);
            // === PAGE 1 HEADER ===
            // Institutional Branding
            doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a');
            doc.text(layout.header.institution.toUpperCase(), leftMargin, 40, { width: headerTextWidth });

            doc.font('Helvetica').fontSize(9).fillColor('#334155');
            doc.text(layout.header.department, leftMargin, 54, { width: headerTextWidth });
            doc.text(`Curso: ${layout.header.course}  |  Disciplina: ${layout.header.discipline}`, leftMargin, 67, { width: headerTextWidth, height: 12 });
            doc.text(`Turma: ${layout.header.classGroup}  |  Caderno: ${versionLetter}`, leftMargin, 80, { width: headerTextWidth });

            doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a');
            doc.text(`${layout.header.title} — ${layout.header.semester}`, leftMargin, 95);

            // Box NOTA (Top Right)
            if (includeBoxNota) {
              const boxX = pageWidth - rightMargin - 95 - (showQrCode ? 70 : 0);
              const boxY = 40;
              const boxW = 95;
              const boxH = 55;

              doc.lineWidth(1).strokeColor('#0f172a').rect(boxX, boxY, boxW, boxH).stroke();
              doc.rect(boxX, boxY, boxW, 16).fillColor('#f1f5f9').fill();
              doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a').text('NOTA', boxX, boxY + 4, {
                width: boxW,
                align: 'center',
              });
              doc.moveTo(boxX, boxY + 16).lineTo(boxX + boxW, boxY + 16).stroke();
            }

            // Divider line
            doc.moveTo(leftMargin, 115).lineTo(pageWidth - rightMargin, 115).lineWidth(1.5).strokeColor('#0f172a').stroke();

            // Student Fill Area
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a');
            doc.text('ESTUDANTE / NOME:', leftMargin, 125);
            doc.font('Helvetica').fontSize(9).fillColor('#64748b');
            doc.text('__________________________________________________________________', leftMargin + 115, 125);

            doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a');
            doc.text('MATRÍCULA:', leftMargin, 142);
            doc.font('Helvetica').fontSize(9).fillColor('#64748b');
            doc.text('________________________', leftMargin + 70, 142);

            doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a');
            doc.text('DATA:', leftMargin + 225, 142);
            doc.font('Helvetica').fontSize(9).fillColor('#334155');
            doc.text(layout.header.date || '____/____/________', leftMargin + 260, 142);

            doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a');
            doc.text('TURMA:', leftMargin + 375, 142);
            doc.font('Helvetica').fontSize(9).fillColor('#334155');
            doc.text(layout.header.classGroup, leftMargin + 420, 142);

            // Instructions Box
            let instY = 162;
            doc.rect(leftMargin, instY, contentWidth, 38).fillColor('#f8fafc').strokeColor('#cbd5e1').lineWidth(0.5).fillAndStroke();
            doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#475569');
            const instructionsText = layout.header.instructions.join(' • ');
            doc.text(instructionsText, leftMargin + 7, instY + 6, {
              width: contentWidth - 14,
              lineGap: 2,
            });

            // QR Code (Top right if space allows, or bottom of page)
            if (showQrCode) {
              const qrPayload = JSON.stringify({
                app: 'CORREGE',
                exam: layout.header.code,
                ver: versionLetter,
                pg: page.pageNumber,
              });
              const qrBuffer = await QRCode.toBuffer(qrPayload, {
                errorCorrectionLevel: 'M',
                margin: 1,
                width: 60,
              });
              doc.image(qrBuffer, pageWidth - rightMargin - 60, 40, { width: 55, height: 55 });
            }

            doc.y = 215;
          } else {
            // Continuation Header on Subsequent Pages
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#64748b');
            doc.text(
              `${layout.header.institution} — ${layout.header.title} (Caderno ${versionLetter})`,
              leftMargin,
              40
            );
            doc.moveTo(leftMargin, 52).lineTo(pageWidth - rightMargin, 52).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
            doc.y = 65;
          }

          // Questions for this page
          for (const q of page.questions) {
            // Question Statement
            doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0f172a');
            doc.text(`${q.orderIndex}. ${q.statement}`, leftMargin, doc.y, {
              width: contentWidth,
              lineGap: 2,
            });
            doc.y += 4;

            // Alternatives
            for (const alt of q.alternatives) {
              const isCorrect = alt.letter === q.correctAlternative;
              const highlight = showAnswerKey && isCorrect;

              if (highlight) {
                doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1d4ed8');
                doc.text(`(${alt.letter})  ${alt.text}   [GABARITO OFICIAL]`, leftMargin + 15, doc.y, {
                  width: contentWidth - 15,
                });
              } else {
                doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b');
                doc.text(`(${alt.letter})  ${alt.text}`, leftMargin + 15, doc.y, {
                  width: contentWidth - 15,
                });
              }
              doc.y += 2;
            }
            doc.y += 12;
          }

          // Footer (margem inferior zerada só aqui: evita que o PDFKit crie páginas em branco)
          const prevBottomMargin = doc.page.margins.bottom;
          doc.page.margins.bottom = 0;
          const footerY = doc.page.height - 35;
          doc.moveTo(leftMargin, footerY - 5).lineTo(pageWidth - rightMargin, footerY - 5).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
          doc.font('Helvetica').fontSize(8).fillColor('#94a3b8');
          doc.text(`Correge • ${layout.header.code}`, leftMargin, footerY);
          const sideLabel = isDuplex ? (isOddPage ? ' [Frente]' : ' [Verso]') : '';
          doc.text(
            `Página ${page.pageNumber} de ${totalPages}${sideLabel} — Caderno ${versionLetter}`,
            pageWidth - rightMargin - 180,
            footerY,
            { width: 180, align: 'right' }
          );
          doc.page.margins.bottom = prevBottomMargin;
        }

        // Duplex Compensating Blank Verso Page when odd total pages
        // 1. Booklet Blank Verso (if question pages count is odd and duplex is active)
        // Garante que o caderno de questões finalize sua folha física, de modo que
        // a folha de respostas NUNCA seja o verso de uma página de questões.
        if (needsBookletBlankVerso) {
          doc.addPage();
        }

        // 2. Official OMR Answer Sheet Page (sempre em frente de folha física virgem)
        if (includeAnswerSheet) {
          doc.addPage();
          doc.page.margins.bottom = 0; // sem quebra automática: rodapé e trilha OMR ficam na mesma página
          const pageWidth = doc.page.width;
          const pageHeight = doc.page.height;
          const ansPageNumber = doc.bufferedPageRange().count;
          const leftMargin = isDuplex ? 52 : 45;
          const rightMargin = isDuplex ? 38 : 45;
          const contentWidth = pageWidth - (leftMargin + rightMargin);

          // OMR Corner alignment markers
          doc.rect(leftMargin - 15, 30, 8, 8).fillColor('#0f172a').fill();
          doc.rect(pageWidth - rightMargin + 7, 30, 8, 8).fillColor('#0f172a').fill();
          doc.rect(leftMargin - 15, pageHeight - 38, 8, 8).fillColor('#0f172a').fill();
          doc.rect(pageWidth - rightMargin + 7, pageHeight - 38, 8, 8).fillColor('#0f172a').fill();

          // Header
          doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#0f172a');
          doc.text(layout.header.institution.toUpperCase(), leftMargin, 38);
          doc.fontSize(12).text('CARTÃO-RESPOSTA OFICIAL (FOLHA OMR)', leftMargin, 52);
          doc.font('Helvetica').fontSize(8.5).fillColor('#475569');
          doc.text(`${layout.header.title}  |  Caderno ${versionLetter}  |  Código: ${layout.header.code}`, leftMargin, 68);

          // QR Code (top right)
          if (showQrCode) {
            const qrPayload = JSON.stringify({
              app: 'CORREGE_OMR',
              code: layout.header.code,
              ver: versionLetter,
              pages: totalPages,
            });
            const qrBuffer = await QRCode.toBuffer(qrPayload, {
              errorCorrectionLevel: 'M',
              margin: 1,
              width: 70,
            });
            doc.image(qrBuffer, pageWidth - rightMargin - 65, 30, { width: 54, height: 54 });
          }

          // Bolhas de versão do caderno (A–D): o aluno marca o caderno que recebeu
          const verBoxX = pageWidth - rightMargin - 65 - 135;
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f172a');
          doc.text('CADERNO (marque o seu):', verBoxX, 38, { lineBreak: false });
          (['A', 'B', 'C', 'D'] as const).forEach((l, i) => {
            const bx = verBoxX + 6 + i * 30;
            doc.circle(bx + 5, 56, 6).lineWidth(0.75).strokeColor('#0f172a').stroke();
            doc.font('Helvetica').fontSize(7).fillColor('#0f172a');
            doc.text(l, bx + 2.5, 53.5, { lineBreak: false });
          });

          // Student Info Box
          const boxY = 88;
          doc.rect(leftMargin, boxY, contentWidth, 36).fillColor('#f8fafc').strokeColor('#cbd5e1').lineWidth(0.75).fillAndStroke();
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#334155');
          doc.text('ESTUDANTE / NOME:', leftMargin + 8, boxY + 8);
          doc.font('Helvetica').fontSize(8.5).fillColor('#64748b');
          doc.text('__________________________________________________________', leftMargin + 115, boxY + 8);
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#334155');
          doc.text('MATRÍCULA: _____________________', leftMargin + 8, boxY + 22);
          doc.text(`TURMA: ${layout.header.classGroup}`, leftMargin + 220, boxY + 22);
          doc.text(`DATA: ${layout.header.date || '____/____/________'}`, leftMargin + 320, boxY + 22);

          // Instructions
          const instY = 130;
          doc.rect(leftMargin, instY, contentWidth, 18).fillColor('#f1f5f9').fill();
          doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a');
          doc.text('INSTRUÇÃO: Preencha totalmente a bolha com caneta preta ou azul. Marcas parciais ou rasuras = ERRADO.', leftMargin + 8, instY + 5);

          // OMR Bubbles Grid
          const gridY = 158;
          const allQuestions: ExamQuestionLayoutDTO[] = [];
          layout.pages.forEach((p) => allQuestions.push(...p.questions));
          const totalQ = allQuestions.length;
          const cols = totalQ > 25 ? 3 : 2;
          const qPerCol = Math.ceil(totalQ / cols);
          const colWidth = contentWidth / cols;

          doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a');
          for (let c = 0; c < cols; c++) {
            const startQ = c * qPerCol;
            const endQ = Math.min((c + 1) * qPerCol, totalQ);
            const colX = leftMargin + c * colWidth;

            // Column Header
            doc.text('Nº     (A)   (B)   (C)   (D)   (E)', colX + 5, gridY);
            doc.moveTo(colX + 5, gridY + 12).lineTo(colX + colWidth - 15, gridY + 12).lineWidth(0.5).strokeColor('#cbd5e1').stroke();

            for (let qIdx = startQ; qIdx < endQ; qIdx++) {
              const qNum = qIdx + 1;
              const qStr = qNum < 10 ? `0${qNum}` : `${qNum}`;
              const rowY = gridY + 18 + (qIdx - startQ) * 18;

              doc.font('Helvetica-Bold').fontSize(8).fillColor('#334155');
              doc.text(`${qStr}.`, colX + 5, rowY);

              const letters = ['A', 'B', 'C', 'D', 'E'];
              letters.forEach((l, lIdx) => {
                const bubbleX = colX + 28 + lIdx * 18;
                doc.circle(bubbleX + 4, rowY + 4, 5.5).lineWidth(0.75).strokeColor('#0f172a').stroke();
                doc.font('Helvetica').fontSize(6.5).fillColor('#0f172a');
                doc.text(l, bubbleX + 1.5, rowY + 1);
              });
            }
          }

          // Timing Track & Bottom Bar
          const trackY = pageHeight - 48;
          for (let b = 0; b < 24; b++) {
            const blockX = leftMargin + 85 + b * 14;
            if (b % 2 === 0) {
              doc.rect(blockX, trackY, 9, 6).fillColor('#0f172a').fill();
            } else {
              doc.rect(blockX, trackY, 9, 6).fillColor('#e2e8f0').fill();
            }
          }
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f172a');
          doc.text('OMR-ALIGN-L1', leftMargin, trackY, { lineBreak: false });
          doc.text('OMR-ALIGN-R1', pageWidth - rightMargin - 70, trackY, { lineBreak: false });

          // Footer
          const footerY = pageHeight - 32;
          doc.moveTo(leftMargin, footerY - 5).lineTo(pageWidth - rightMargin, footerY - 5).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
          doc.font('Helvetica').fontSize(8).fillColor('#94a3b8');
          doc.text(`Correge • ${layout.header.code}`, leftMargin, footerY);
          doc.text(
            `Página ${ansPageNumber} de ${totalPages} [Cartão-Resposta] — Caderno ${versionLetter}`,
            pageWidth - rightMargin - 200,
            footerY,
            { width: 200, align: 'right' }
          );

          // 3. Verso 100% em branco da Folha de Respostas (para devolução limpa ao professor)
          // Nenhuma tinta é impressa nesta página; atua apenas como compensador de folha física duplex.
          if (isDuplex) {
            doc.addPage();
          }
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async generateExamPdf(request: GenerateExamPdfRequestDTO): Promise<ExamPdfResultDTO> {
    const versionLetter = request.versionLetter || 'A';
    const layout = await this.getExamLayout(request.examId, versionLetter);
    const pdfBuffer = await this.generatePdfBuffer(request);
    const isDuplex = request.isDuplex ?? false;
    const answerSheetOnly = request.answerSheetOnly ?? false;
    const includeAnswerSheet = answerSheetOnly ? true : (request.includeAnswerSheet ?? false);
    const questionPageCount = answerSheetOnly ? 0 : layout.pages.length;
    const needsBookletBlankVerso = isDuplex && questionPageCount % 2 !== 0;

    let totalPages = questionPageCount;
    if (includeAnswerSheet) {
      if (needsBookletBlankVerso) totalPages += 1;
      totalPages += 1;
      if (isDuplex) totalPages += 1;
    } else {
      if (needsBookletBlankVerso) totalPages += 1;
    }

    const duplexSuffix = isDuplex ? '-Duplex' : '';
    const answerSuffix = includeAnswerSheet ? '-ComGabarito' : '';

    return {
      examId: request.examId,
      versionLetter,
      fileName: `${answerSheetOnly ? 'FolhaRespostas' : 'Prova'}-${layout.header.code.replace(/[^a-zA-Z0-9]/g, '')}-Caderno-${versionLetter}${duplexSuffix}${answerSheetOnly ? '' : answerSuffix}.pdf`,
      contentType: 'application/pdf',
      fileSizeBytes: pdfBuffer.length,
      pdfBase64: pdfBuffer.toString('base64'),
      totalPages,
      generatedAt: new Date().toISOString(),
    };
  }
}
