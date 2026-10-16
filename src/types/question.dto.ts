export type DifficultyLevel = 'Fácil' | 'Médio' | 'Difícil';
export type QuestionType = 'objetiva' | 'discursiva';
export type AlternativeLetter = 'A' | 'B' | 'C' | 'D' | 'E';

export interface AlternativeDTO {
  id: string;
  letter: AlternativeLetter;
  text: string;
  isCorrect?: boolean;
}

export interface QuestionDTO {
  id: string;
  teacherId?: string;
  code: string;
  type: QuestionType;
  discipline: string;
  difficulty: DifficultyLevel;
  topic?: string;
  tags: string[];
  statement: string;
  alternatives: AlternativeDTO[];
  correctAlternative: AlternativeLetter;
  gabaritoDisplay?: string;
  points: number;
  maxScore?: number;
  explanation?: string;
  createdAt?: string;
  deletedAt?: string;
}

export interface QuestionFilterDTO {
  difficulty?: string;
  tag?: string;
  discipline?: string;
  type?: string;
  search?: string;
}

export interface CreateQuestionRequestDTO {
  teacherId?: string;
  code?: string;
  type?: QuestionType;
  discipline: string;
  difficulty: DifficultyLevel;
  topic?: string;
  tags?: string[];
  statement: string;
  alternatives?: {
    id?: string;
    letter: AlternativeLetter;
    text: string;
  }[];
  correctAlternative?: AlternativeLetter;
  points?: number;
  maxScore?: number;
  explanation?: string;
}

export interface UpdateQuestionRequestDTO {
  code?: string;
  type?: QuestionType;
  discipline?: string;
  difficulty?: DifficultyLevel;
  topic?: string;
  tags?: string[];
  statement?: string;
  alternatives?: {
    id?: string;
    letter: AlternativeLetter;
    text: string;
  }[];
  correctAlternative?: AlternativeLetter;
  points?: number;
  maxScore?: number;
  explanation?: string;
}
