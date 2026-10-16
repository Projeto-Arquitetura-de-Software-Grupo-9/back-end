import ExcelJS from 'exceljs';
import { IStudentRepository } from '../repositories/interfaces/IStudentRepository';
import {
  CreateStudentRequestDTO,
  ImportStudentsResultDTO,
  StudentDTO,
  StudentFilterDTO,
  UpdateStudentRequestDTO,
} from '../types/student.dto';
import { IStudentService } from './interfaces/IStudentService';

export class StudentService implements IStudentService {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async listStudents(filters?: StudentFilterDTO): Promise<StudentDTO[]> {
    return this.studentRepository.findAll(filters);
  }

  async getStudentById(id: string): Promise<StudentDTO> {
    const student = await this.studentRepository.findById(id);
    if (!student) {
      throw new Error(`Student with id "${id}" not found.`);
    }
    return student;
  }

  async createStudent(data: CreateStudentRequestDTO): Promise<StudentDTO> {
    if (!data.name || !data.name.trim()) {
      throw new Error('O nome completo do aluno é obrigatório.');
    }
    if (!data.registration || !data.registration.trim()) {
      throw new Error('A matrícula do aluno é obrigatória.');
    }
    if (!data.email || !data.email.trim()) {
      throw new Error('O e-mail do aluno é obrigatório.');
    }

    return this.studentRepository.create(data);
  }

  async updateStudent(
    id: string,
    data: UpdateStudentRequestDTO
  ): Promise<StudentDTO> {
    const updated = await this.studentRepository.update(id, data);
    if (!updated) {
      throw new Error(`Student with id "${id}" not found.`);
    }
    return updated;
  }

  async deleteStudent(id: string): Promise<void> {
    const deleted = await this.studentRepository.delete(id);
    if (!deleted) {
      throw new Error(`Student with id "${id}" not found.`);
    }
  }

  async deleteStudentsBatch(ids: string[]): Promise<{ deletedCount: number }> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Informe ao menos um ID de aluno para exclusão em massa.');
    }
    const deletedCount = await this.studentRepository.deleteBatch(ids);
    return { deletedCount };
  }

  async importStudents(
    students: CreateStudentRequestDTO[]
  ): Promise<ImportStudentsResultDTO> {
    if (!Array.isArray(students) || students.length === 0) {
      throw new Error('Nenhum registro de aluno fornecido para importação.');
    }

    const validRows = students.filter(
      (s) => s && s.name && s.name.trim() && s.registration && s.registration.trim()
    );

    if (validRows.length === 0) {
      throw new Error('Nenhum registro válido encontrado na lista enviada.');
    }

    const created = await this.studentRepository.importBatch(validRows);
    const all = await this.studentRepository.findAll();

    return {
      importedCount: created.length,
      totalStudents: all.length,
      students: created,
    };
  }

  async importStudentsFromExcelBuffer(
    buffer: Buffer
  ): Promise<ImportStudentsResultDTO> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('Planilha Excel vazia ou inválida.');
    }

    const parsedStudents: CreateStudentRequestDTO[] = [];

    worksheet.eachRow((row, rowNumber) => {
      // Skip header row
      if (rowNumber === 1) return;

      const name = String(row.getCell(1).value || '').trim();
      const registration = String(row.getCell(2).value || '').trim();
      const course = String(row.getCell(3).value || 'Direito').trim();
      const email = String(
        row.getCell(4).value ||
          `${name.toLowerCase().replace(/\s+/g, '.')}@universidade.edu.br`
      ).trim();
      const classGroup = String(row.getCell(5).value || 'Turma A').trim();
      const discipline = String(
        row.getCell(6).value || 'Direito Constitucional'
      ).trim();
      const examsTaken = Number(row.getCell(7).value || 0);
      const overallAverage = Number(row.getCell(8).value || 0);

      if (name && registration) {
        parsedStudents.push({
          name,
          registration,
          course,
          email,
          classGroup,
          discipline,
          examsTaken: Number.isNaN(examsTaken) ? 0 : examsTaken,
          overallAverage: Number.isNaN(overallAverage) ? 0 : overallAverage,
        });
      }
    });

    return this.importStudents(parsedStudents);
  }

  async exportStudentsToExcelBuffer(filters?: StudentFilterDTO): Promise<Buffer> {
    const students = await this.studentRepository.findAll(filters);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Alunos Cadastrados');

    sheet.columns = [
      { header: 'Nome Completo', key: 'name', width: 32 },
      { header: 'Matrícula', key: 'registration', width: 16 },
      { header: 'Curso', key: 'course', width: 18 },
      { header: 'Email', key: 'email', width: 34 },
      { header: 'Turma', key: 'classGroup', width: 16 },
      { header: 'Disciplina', key: 'discipline', width: 28 },
      { header: 'Provas Realizadas', key: 'examsTaken', width: 18 },
      { header: 'Média Geral', key: 'overallAverage', width: 14 },
    ];

    students.forEach((std) => {
      sheet.addRow({
        name: std.name,
        registration: std.registration,
        course: std.course,
        email: std.email,
        classGroup: std.classGroup,
        discipline: std.discipline,
        examsTaken: std.examsTaken,
        overallAverage: std.overallAverage,
      });
    });

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  async getDisciplines(): Promise<string[]> {
    return this.studentRepository.getDistinctDisciplines();
  }
}
