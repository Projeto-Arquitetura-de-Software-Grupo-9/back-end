/**
 * DTOs for Exam Paper Generation and Layout Simulation (A4 Standard)
 * Clean Architecture - Decoupled from DB entities
 */

export type ExamVersionLetter = 'A' | 'B' | 'C' | 'D';

export interface ExamAlternativeDTO {
  id: string;
  letter: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
}

export interface ExamQuestionLayoutDTO {
  id: string;
  originalQuestionId: string;
  orderIndex: number;
  statement: string;
  discipline: string;
  alternatives: ExamAlternativeDTO[];
  correctAlternative: 'A' | 'B' | 'C' | 'D' | 'E';
  pointValue?: number;
}

export interface ExamHeaderDTO {
  institution: string;
  department: string;
  course: string;
  discipline: string;
  classGroup: string;
  semester: string;
  title: string;
  subtitle?: string;
  code: string;
  date: string;
  duration: string;
  instructions: string[];
  includeBoxNota: boolean;
}

export interface ExamPageDTO {
  pageNumber: number;
  totalPages: number;
  versionLetter: ExamVersionLetter;
  isFirstPage: boolean;
  header?: ExamHeaderDTO;
  questions: ExamQuestionLayoutDTO[];
}

export interface ExamLayoutDTO {
  examId: string;
  title: string;
  versionLetter: ExamVersionLetter;
  pageSize: 'A4';
  dimensionsMm: {
    width: 210;
    height: 297;
  };
  dimensionsPx: {
    width: 794;
    height: 1123;
  };
  marginsMm: {
    top: 15;
    bottom: 15;
    left: 15;
    right: 15;
  };
  header: ExamHeaderDTO;
  totalPages: number;
  pages: ExamPageDTO[];
  qrCodePayload: string;
  answerKey: Record<number, 'A' | 'B' | 'C' | 'D' | 'E'>;
}

export interface GenerateExamPdfRequestDTO {
  examId: string;
  versionLetter?: ExamVersionLetter;
  showAnswerKey?: boolean;
  showQrCode?: boolean;
  includeBoxNota?: boolean;
  isDuplex?: boolean;
  includeAnswerSheet?: boolean;
  /** Gera somente a folha de respostas (sem as páginas de questões) */
  answerSheetOnly?: boolean;
}

export interface ExamPdfResultDTO {
  examId: string;
  versionLetter: ExamVersionLetter;
  fileName: string;
  contentType: 'application/pdf';
  fileSizeBytes: number;
  pdfBase64: string;
  totalPages: number;
  generatedAt: string;
}
