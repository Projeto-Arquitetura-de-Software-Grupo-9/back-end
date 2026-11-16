import { ExamHeaderDTO, ExamLayoutDTO, ExamQuestionLayoutDTO, ExamVersionLetter } from '../../types/examPdf.dto';

export interface ExamRecordDTO {
  id: string;
  code: string;
  title: string;
  subtitle?: string;
  institution: string;
  department: string;
  course: string;
  discipline: string;
  disciplinaId?: string | null;
  classGroup: string;
  semester: string;
  date: string;
  duration: string;
  instructions: string[];
  includeBoxNota: boolean;
  variationsJson?: any;
  createdAt?: Date | string;
  versions?: any[];
  disciplinaRef?: any;
}

export interface CreateExamDTO {
  id?: string;
  code?: string;
  title: string;
  subtitle?: string;
  institution: string;
  department: string;
  course: string;
  discipline: string;
  disciplinaId?: string | null;
  classGroup: string;
  semester: string;
  date: string;
  duration: string;
  instructions: string[];
  includeBoxNota: boolean;
  variationsJson?: any;
}

export interface UpdateExamDTO {
  code?: string;
  title?: string;
  subtitle?: string;
  institution?: string;
  department?: string;
  course?: string;
  discipline?: string;
  disciplinaId?: string | null;
  classGroup?: string;
  semester?: string;
  date?: string;
  duration?: string;
  instructions?: string[];
  includeBoxNota?: boolean;
  variationsJson?: any;
}

export interface IExamLayoutRepository {
  getExamById(id: string): Promise<ExamLayoutDTO | null>;
  getExamLayout(id: string, versionLetter?: ExamVersionLetter): Promise<ExamLayoutDTO | null>;
  getExamQuestions(id: string, versionLetter: ExamVersionLetter): Promise<ExamQuestionLayoutDTO[]>;
  getExamHeader(id: string): Promise<ExamHeaderDTO | null>;
}

export interface IExamRepository extends IExamLayoutRepository {
  // Hexagonal CRUD operations
  listExams(disciplinaId?: string): Promise<ExamRecordDTO[]>;
  findExamById(id: string): Promise<ExamRecordDTO | null>;
  createExam(data: CreateExamDTO): Promise<ExamRecordDTO>;
  updateExam(id: string, data: UpdateExamDTO): Promise<ExamRecordDTO>;
  deleteExam(id: string): Promise<boolean>;
}
