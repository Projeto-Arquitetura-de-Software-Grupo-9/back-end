import {
  CreateStudentRequestDTO,
  ImportStudentsResultDTO,
  StudentDTO,
  StudentFilterDTO,
  UpdateStudentRequestDTO,
} from '../../types/student.dto';

export interface IStudentService {
  listStudents(filters?: StudentFilterDTO): Promise<StudentDTO[]>;
  getStudentById(id: string): Promise<StudentDTO>;
  createStudent(data: CreateStudentRequestDTO): Promise<StudentDTO>;
  updateStudent(id: string, data: UpdateStudentRequestDTO): Promise<StudentDTO>;
  deleteStudent(id: string): Promise<void>;
  deleteStudentsBatch(ids: string[]): Promise<{ deletedCount: number }>;
  importStudents(students: CreateStudentRequestDTO[]): Promise<ImportStudentsResultDTO>;
  importStudentsFromExcelBuffer(buffer: Buffer): Promise<ImportStudentsResultDTO>;
  buildImportTemplateBuffer(): Promise<Buffer>;
  exportStudentsToExcelBuffer(filters?: StudentFilterDTO): Promise<Buffer>;
  getDisciplines(): Promise<string[]>;
}
