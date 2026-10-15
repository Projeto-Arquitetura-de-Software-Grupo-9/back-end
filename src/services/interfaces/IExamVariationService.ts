import {
  ExamVariationResultDTO,
  GenerateVariationsRequestDTO,
  StudentAssignmentDTO,
} from '../../types/examVariation.dto';

export interface IExamVariationService {
  generateVariations(request: GenerateVariationsRequestDTO): Promise<ExamVariationResultDTO>;
  getVariations(examId: string): Promise<ExamVariationResultDTO | null>;
  distributeStudents(
    examId: string,
    students: { id: string; name: string; registration: string }[]
  ): Promise<StudentAssignmentDTO[]>;
}
