import { ExamHeaderDTO, ExamLayoutDTO, ExamQuestionLayoutDTO, ExamVersionLetter } from '../../types/examPdf.dto';

export interface IExamRepository {
  getExamById(id: string): Promise<ExamLayoutDTO | null>;
  getExamLayout(id: string, versionLetter: ExamVersionLetter): Promise<ExamLayoutDTO | null>;
  getExamQuestions(id: string, versionLetter: ExamVersionLetter): Promise<ExamQuestionLayoutDTO[]>;
  getExamHeader(id: string): Promise<ExamHeaderDTO | null>;
}
