import {
  CreateStudentRequestDTO,
  StudentDTO,
  StudentFilterDTO,
  UpdateStudentRequestDTO,
} from '../../types/student.dto';

export interface IStudentRepository {
  findAll(filters?: StudentFilterDTO): Promise<StudentDTO[]>;
  findById(id: string): Promise<StudentDTO | null>;
  findByRegistration(registration: string): Promise<StudentDTO | null>;
  create(data: CreateStudentRequestDTO): Promise<StudentDTO>;
  update(id: string, data: UpdateStudentRequestDTO): Promise<StudentDTO | null>;
  delete(id: string): Promise<boolean>;
  deleteBatch(ids: string[]): Promise<number>;
  importBatch(students: CreateStudentRequestDTO[]): Promise<StudentDTO[]>;
  getDistinctDisciplines(): Promise<string[]>;
}
