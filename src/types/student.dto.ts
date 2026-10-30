export interface StudentDTO {
  id: string;
  name: string;
  registration: string;
  course: string;
  email: string;
  classGroup: string;
  classId?: string;
  discipline: string;
  examsTaken: number;
  overallAverage: number;
  status?: 'approved' | 'warning' | 'failed';
  createdAt?: string;
}

export interface StudentFilterDTO {
  discipline?: string;
  classGroup?: string;
  course?: string;
  search?: string;
}

export interface CreateStudentRequestDTO {
  name: string;
  registration: string;
  course?: string;
  email: string;
  classGroup?: string;
  classId?: string;
  discipline?: string;
  examsTaken?: number;
  overallAverage?: number;
}

export interface UpdateStudentRequestDTO {
  name?: string;
  registration?: string;
  course?: string;
  email?: string;
  classGroup?: string;
  classId?: string;
  discipline?: string;
  examsTaken?: number;
  overallAverage?: number;
}

export interface BatchDeleteStudentsRequestDTO {
  ids: string[];
}

export interface ImportStudentsRequestDTO {
  students: CreateStudentRequestDTO[];
}

export interface ImportRowErrorDTO {
  /** Número da linha na planilha (ou posição na lista JSON, começando em 1) */
  row: number;
  registration?: string;
  reason: string;
}

export interface ImportStudentsResultDTO {
  importedCount: number;
  skippedCount: number;
  totalStudents: number;
  students: StudentDTO[];
  errors: ImportRowErrorDTO[];
}
