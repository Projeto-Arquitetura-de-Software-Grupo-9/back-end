import { ExamVariationResultDTO, VariationQuestionDTO } from '../../types/examVariation.dto';

export interface IExamVariationRepository {
  getBaseQuestions(examId: string): Promise<VariationQuestionDTO[]>;
  saveVariations(examId: string, result: ExamVariationResultDTO): Promise<void>;
  getVariations(examId: string): Promise<ExamVariationResultDTO | null>;
}
