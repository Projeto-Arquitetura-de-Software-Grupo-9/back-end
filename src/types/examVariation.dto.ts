/**
 * DTOs for Exam Variations (Criar Provas Diferentes)
 * Clean Architecture - Decoupled from DB entities
 */

export type ExamVersionLetter = 'A' | 'B' | 'C' | 'D';
export type PermutationStrategy = 'FISHER_YATES' | 'CYCLIC_ROTATION' | 'TOPIC_BALANCED';

export interface VariationAlternativeDTO {
  id: string;
  letter: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
}

export interface VariationQuestionDTO {
  originalQuestionId: string;
  orderIndex: number;
  statement: string;
  discipline?: string;
  topic?: string;
  difficulty?: string;
  alternatives: VariationAlternativeDTO[];
  correctAlternative: 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface ExamVersionResultDTO {
  versionLetter: ExamVersionLetter;
  examCode: string;
  questions: VariationQuestionDTO[];
  answerKey: Record<number, 'A' | 'B' | 'C' | 'D' | 'E'>;
}

export interface CrossAnswerKeyEntryDTO {
  originalQuestionId: string;
  orderIndexA: number;
  correctLetterA: string;
  orderIndexB?: number;
  correctLetterB?: string;
  orderIndexC?: number;
  correctLetterC?: string;
  orderIndexD?: number;
  correctLetterD?: string;
}

export interface StudentAssignmentDTO {
  studentId: string;
  studentName: string;
  registration: string;
  assignedVersion: ExamVersionLetter;
}

export interface GenerateVariationsRequestDTO {
  examId: string;
  numberOfVersions: number; // 1 to 4
  shuffleQuestions: boolean;
  shuffleAlternatives: boolean;
  strategy?: PermutationStrategy;
  students?: {
    id: string;
    name: string;
    registration: string;
  }[];
}

export interface ExamVariationResultDTO {
  examId: string;
  numberOfVersions: number;
  versions: ExamVersionResultDTO[];
  crossAnswerKeyMatrix: CrossAnswerKeyEntryDTO[];
  studentAssignments: StudentAssignmentDTO[];
  generatedAt: string;
}
