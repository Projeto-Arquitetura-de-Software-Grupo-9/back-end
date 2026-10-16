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

export interface ImportStudentsResultDTO {
  importedCount: number;
  totalStudents: number;
  students: StudentDTO[];
}
