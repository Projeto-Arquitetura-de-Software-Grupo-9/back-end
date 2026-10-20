import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { IExamRepository } from '../repositories/interfaces/IExamRepository';
import {
  ExamLayoutDTO,
  ExamPdfResultDTO,
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
        const needsBlankVerso = isDuplex && layout.pages.length % 2 !== 0;
        const totalPages = needsBlankVerso ? layout.pages.length + 1 : layout.pages.length;

        // Render Page by Page
        for (let i = 0; i < layout.pages.length; i++) {
          const page = layout.pages[i];
          doc.addPage();

          const pageWidth = doc.page.width;
          const isOddPage = (i + 1) % 2 !== 0;
          const leftMargin = isDuplex ? (isOddPage ? 52 : 38) : 45;
          const rightMargin = isDuplex ? (isOddPage ? 38 : 52) : 45;
          const contentWidth = pageWidth - (leftMargin + rightMargin);

          if (page.isFirstPage) {
            // === PAGE 1 HEADER ===
            // Institutional Branding
            doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a');
            doc.text(layout.header.institution.toUpperCase(), leftMargin, 40, { width: contentWidth - 110 });

            doc.font('Helvetica').fontSize(9).fillColor('#334155');
            doc.text(layout.header.department, leftMargin, 54, { width: contentWidth - 110 });
            doc.text(`Curso: ${layout.header.course}  |  Disciplina: ${layout.header.discipline}`, leftMargin, 67);
            doc.text(`Turma: ${layout.header.classGroup}  |  Caderno: ${versionLetter}`, leftMargin, 80);

            doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a');
            doc.text(`${layout.header.title} — ${layout.header.semester}`, leftMargin, 95);

            // Box NOTA (Top Right)
            if (includeBoxNota) {
              const boxX = pageWidth - rightMargin - 95;
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
              doc.image(qrBuffer, pageWidth - rightMargin - 60, 122, { width: 50, height: 50 });
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

          // Footer
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
        }

        // Duplex Compensating Blank Verso Page when odd total pages
        if (needsBlankVerso) {
          doc.addPage();
          const pageWidth = doc.page.width;
          const pageHeight = doc.page.height;
          const blankPageNum = totalPages;
          const leftMargin = 38;
          const rightMargin = 52;

          // Header
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#64748b');
          doc.text(
            `COMPENSAÇÃO FRENTE E VERSO (DUPLEX) — ${layout.header.institution}`,
            leftMargin,
            40
          );
          doc.moveTo(leftMargin, 52).lineTo(pageWidth - rightMargin, 52).lineWidth(0.5).strokeColor('#cbd5e1').stroke();

          // Center Callout Box
          const boxW = 380;
          const boxH = 120;
          const boxX = (pageWidth - boxW) / 2;
          const boxY = (pageHeight - boxH) / 2 - 20;

          doc.rect(boxX, boxY, boxW, boxH).fillColor('#f8fafc').strokeColor('#cbd5e1').lineWidth(0.75).fillAndStroke();
          doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a');
          doc.text(
            'PÁGINA EM BRANCO INTENCIONAL (MODO FRENTE E VERSO)',
            boxX,
            boxY + 24,
            { width: boxW, align: 'center' }
          );

          doc.font('Helvetica').fontSize(9).fillColor('#475569');
          doc.text(
            'Esta página foi inserida para permitir a impressão frente e verso (duplex) deste caderno sem que o conteúdo da próxima avaliação seja impresso no verso desta folha física.',
            boxX + 24,
            boxY + 50,
            { width: boxW - 48, align: 'center', lineGap: 3 }
          );

          doc.font('Helvetica-Oblique').fontSize(8).fillColor('#94a3b8');
          doc.text(
            `Caderno ${versionLetter} • Verso da Folha Final`,
            boxX,
            boxY + 95,
            { width: boxW, align: 'center' }
          );

          // Footer
          const footerY = pageHeight - 35;
          doc.moveTo(leftMargin, footerY - 5).lineTo(pageWidth - rightMargin, footerY - 5).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
          doc.font('Helvetica').fontSize(8).fillColor('#94a3b8');
          doc.text(`Correge • ${layout.header.code}`, leftMargin, footerY);
          doc.text(
            `Página ${blankPageNum} de ${totalPages} [Verso] — Caderno ${versionLetter}`,
            pageWidth - rightMargin - 180,
            footerY,
            { width: 180, align: 'right' }
          );
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
    const needsBlankVerso = isDuplex && layout.pages.length % 2 !== 0;
    const totalPages = needsBlankVerso ? layout.pages.length + 1 : layout.pages.length;

    return {
      examId: request.examId,
      versionLetter,
      fileName: `Prova-${layout.header.code.replace(/[^a-zA-Z0-9]/g, '')}-Caderno-${versionLetter}${isDuplex ? '-Duplex' : ''}.pdf`,
      contentType: 'application/pdf',
      fileSizeBytes: pdfBuffer.length,
      pdfBase64: pdfBuffer.toString('base64'),
      totalPages,
      generatedAt: new Date().toISOString(),
    };
  }
}
