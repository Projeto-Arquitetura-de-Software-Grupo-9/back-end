import ExcelJS from 'exceljs';
import { IStudentRepository } from '../repositories/interfaces/IStudentRepository';
import {
  CreateStudentRequestDTO,
  ImportRowErrorDTO,
  ImportStudentsResultDTO,
  StudentDTO,
  StudentFilterDTO,
  UpdateStudentRequestDTO,
} from '../types/student.dto';
import { IStudentService } from './interfaces/IStudentService';

type ImportField =
  | 'name'
  | 'registration'
  | 'course'
  | 'email'
  | 'classGroup'
  | 'discipline'
  | 'examsTaken'
  | 'overallAverage';

const DEFAULT_COLUMN_ORDER: ImportField[] = [
  'name',
  'registration',
  'course',
  'email',
  'classGroup',
  'discipline',
  'examsTaken',
  'overallAverage',
];

const HEADER_ALIASES: Record<string, ImportField> = {
  nome: 'name',
  nomecompleto: 'name',
  aluno: 'name',
  estudante: 'name',
  name: 'name',
  matricula: 'registration',
  ra: 'registration',
  registro: 'registration',
  registration: 'registration',
  curso: 'course',
  course: 'course',
  email: 'email',
  emailinstitucional: 'email',
  turma: 'classGroup',
  classgroup: 'classGroup',
  disciplina: 'discipline',
  discipline: 'discipline',
  provasrealizadas: 'examsTaken',
  examstaken: 'examsTaken',
  mediageral: 'overallAverage',
  media: 'overallAverage',
  overallaverage: 'overallAverage',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

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

  /**
   * Importa uma lista de alunos (JSON). Linhas inválidas ou com matrícula já
   * cadastrada (ou repetida na própria lista) são puladas e devolvidas em `errors`.
   */
  async importStudents(
    students: CreateStudentRequestDTO[]
  ): Promise<ImportStudentsResultDTO> {
    if (!Array.isArray(students) || students.length === 0) {
      throw new Error('Nenhum registro de aluno fornecido para importação.');
    }
    return this.importRows(students.map((data, i) => ({ row: i + 1, data })));
  }

  async importStudentsFromExcelBuffer(
    buffer: Buffer
  ): Promise<ImportStudentsResultDTO> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(buffer as any);
    } catch {
      throw new Error('Arquivo inválido ou corrompido. Envie uma planilha Excel (.xlsx).');
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('Planilha Excel vazia ou inválida.');
    }

    // Mapeia colunas pelo cabeçalho (ignora acentos/maiúsculas e ordem das colunas).
    // Se o cabeçalho não for reconhecido, usa a ordem padrão do modelo.
    const columns: Partial<Record<ImportField, number>> = {};
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      const field = HEADER_ALIASES[normalizeHeader(this.cellToText(cell.value))];
      if (field && columns[field] === undefined) columns[field] = colNumber;
    });
    if (columns.name === undefined || columns.registration === undefined) {
      DEFAULT_COLUMN_ORDER.forEach((field, i) => {
        columns[field] = i + 1;
      });
    }

    const text = (row: ExcelJS.Row, field: ImportField): string =>
      columns[field] ? this.cellToText(row.getCell(columns[field]!).value) : '';

    const rows: { row: number; data: CreateStudentRequestDTO }[] = [];
    const errors: ImportRowErrorDTO[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // cabeçalho

      const name = text(row, 'name');
      const registration = text(row, 'registration');
      if (!name && !registration) return; // linha em branco

      const examsRaw = text(row, 'examsTaken');
      const avgRaw = text(row, 'overallAverage');
      const examsTaken = examsRaw ? Number(examsRaw.replace(',', '.')) : 0;
      const overallAverage = avgRaw ? Number(avgRaw.replace(',', '.')) : 0;

      if (Number.isNaN(examsTaken) || Number.isNaN(overallAverage)) {
        errors.push({
          row: rowNumber,
          registration: registration || undefined,
          reason: 'Provas realizadas e Média geral devem ser números.',
        });
        return;
      }

      rows.push({
        row: rowNumber,
        data: {
          name,
          registration,
          course: text(row, 'course') || 'Direito',
          email: text(row, 'email') || this.defaultEmail(name),
          classGroup: text(row, 'classGroup') || 'Turma A',
          discipline: text(row, 'discipline') || 'Direito Constitucional',
          examsTaken,
          overallAverage,
        },
      });
    });

    if (rows.length === 0 && errors.length === 0) {
      throw new Error('Nenhum aluno encontrado na planilha. Use o modelo de importação.');
    }

    return this.importRows(rows, errors);
  }

  async buildImportTemplateBuffer(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Alunos');
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
    sheet.getRow(1).font = { bold: true };
    sheet.addRow({
      name: 'Maria da Silva',
      registration: '2026.1.001',
      course: 'Direito',
      email: 'maria.silva@universidade.edu.br',
      classGroup: 'Turma A',
      discipline: 'Direito Constitucional',
      examsTaken: 0,
      overallAverage: 0,
    });
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  /** Valida, remove duplicadas e grava linha a linha, reportando cada falha. */
  private async importRows(
    rows: { row: number; data: CreateStudentRequestDTO }[],
    previousErrors: ImportRowErrorDTO[] = []
  ): Promise<ImportStudentsResultDTO> {
    const errors: ImportRowErrorDTO[] = [...previousErrors];
    const created: StudentDTO[] = [];

    const existing = await this.studentRepository.findAll();
    const knownRegistrations = new Set(
      existing.map((s) => s.registration.trim().toLowerCase())
    );

    for (const { row, data } of rows) {
      const name = String(data?.name ?? '').trim();
      const registration = String(data?.registration ?? '').trim();
      const email = String(data?.email ?? '').trim() || this.defaultEmail(name);
      const fail = (reason: string) =>
        errors.push({ row, registration: registration || undefined, reason });

      if (!name) {
        fail('Nome é obrigatório.');
        continue;
      }
      if (!registration) {
        fail('Matrícula é obrigatória.');
        continue;
      }
      if (!EMAIL_REGEX.test(email)) {
        fail(`E-mail inválido: "${email}".`);
        continue;
      }
      const key = registration.toLowerCase();
      if (knownRegistrations.has(key)) {
        fail('Matrícula já cadastrada (ou repetida na lista).');
        continue;
      }

      try {
        const item = await this.studentRepository.create({ ...data, name, registration, email });
        knownRegistrations.add(key);
        created.push(item);
      } catch (err: any) {
        fail(err?.message || 'Erro ao salvar aluno.');
      }
    }

    errors.sort((a, b) => a.row - b.row);
    const all = await this.studentRepository.findAll();

    return {
      importedCount: created.length,
      skippedCount: errors.length,
      totalStudents: all.length,
      students: created,
      errors,
    };
  }

  private defaultEmail(name: string): string {
    const local = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '');
    return `${local || 'aluno'}@universidade.edu.br`;
  }

  /** Converte qualquer tipo de célula do Excel (texto, número, link, fórmula, rich text) em texto. */
  private cellToText(value: ExcelJS.CellValue | undefined): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toLocaleDateString('pt-BR');
    if (typeof value === 'object') {
      const v: any = value;
      if (Array.isArray(v.richText)) return v.richText.map((r: any) => r.text).join('').trim();
      if (v.text !== undefined) return this.cellToText(v.text);
      if (v.result !== undefined) return this.cellToText(v.result);
      return '';
    }
    return String(value).trim();
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
