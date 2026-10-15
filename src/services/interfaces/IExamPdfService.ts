import {
  ExamLayoutDTO,
  ExamPdfResultDTO,
  ExamVersionLetter,
  GenerateExamPdfRequestDTO,
} from '../../types/examPdf.dto';

export interface IExamPdfService {
  getExamLayout(examId: string, versionLetter?: ExamVersionLetter): Promise<ExamLayoutDTO>;
  generateExamPdf(request: GenerateExamPdfRequestDTO): Promise<ExamPdfResultDTO>;
  generatePdfBuffer(request: GenerateExamPdfRequestDTO): Promise<Buffer>;
}
