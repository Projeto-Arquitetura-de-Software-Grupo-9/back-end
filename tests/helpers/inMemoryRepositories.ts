/**
 * Test-only in-memory repository doubles for isolated unit testing of services and controllers.
 * Production code in src/ uses exclusively Prisma repositories connected to MySQL/TiDB Cloud.
 */
import crypto from 'crypto';
import { Professor } from '@prisma/client';
import {
  CreateProfessorDTO,
  IProfessorRepository,
} from '../../src/repositories/interfaces/IProfessorRepository';
import {
  CreateExamDTO,
  ExamRecordDTO,
  IExamRepository,
  UpdateExamDTO,
} from '../../src/repositories/interfaces/IExamRepository';
import {
  ExamHeaderDTO,
  ExamLayoutDTO,
  ExamPageDTO,
  ExamQuestionLayoutDTO,
  ExamVersionLetter,
} from '../../src/types/examPdf.dto';
import { IExamVariationRepository } from '../../src/repositories/interfaces/IExamVariationRepository';
import {
  ExamVariationResultDTO,
  VariationQuestionDTO,
} from '../../src/types/examVariation.dto';
import { IQrCodeRepository } from '../../src/repositories/interfaces/IQrCodeRepository';
import { QrCodeResultDTO } from '../../src/types/qrCode.dto';
import { IQuestionRepository } from '../../src/repositories/interfaces/IQuestionRepository';
import {
  AlternativeLetter,
  CreateQuestionRequestDTO,
  QuestionDTO,
  QuestionFilterDTO,
  UpdateQuestionRequestDTO,
} from '../../src/types/question.dto';
import { ISettingsRepository } from '../../src/repositories/interfaces/ISettingsRepository';
import {
  AnonymizeTeacherResponseDTO,
  OmrSensitivityLabel,
  SystemSettingsDTO,
  UpdateSettingsRequestDTO,
} from '../../src/types/settings.dto';
import { IStudentRepository } from '../../src/repositories/interfaces/IStudentRepository';
import {
  CreateStudentRequestDTO,
  StudentDTO,
  StudentFilterDTO,
  UpdateStudentRequestDTO,
} from '../../src/types/student.dto';

export class TestProfessorRepository implements IProfessorRepository {
  private items: Professor[] = [];

  async findById(id: string): Promise<Professor | null> {
    return this.items.find((p) => p.id === id) || null;
  }

  async findByEmail(email: string): Promise<Professor | null> {
    const norm = email.trim().toLowerCase();
    return this.items.find((p) => p.email.toLowerCase() === norm) || null;
  }

  async create(data: CreateProfessorDTO): Promise<Professor> {
    const prof: Professor = {
      id: `prof-${crypto.randomUUID()}`,
      nomeCompleto: data.nomeCompleto.trim(),
      email: data.email.trim().toLowerCase(),
      senhaHash: data.senhaHash,
      createdAt: new Date(),
    };
    this.items.push(prof);
    return prof;
  }

  async updatePassword(id: string, senhaHash: string): Promise<Professor> {
    const prof = this.items.find((p) => p.id === id);
    if (!prof) throw new Error('Professor not found');
    prof.senhaHash = senhaHash;
    return prof;
  }

  async anonymize(id: string): Promise<Professor> {
    const prof = this.items.find((p) => p.id === id);
    if (!prof) throw new Error('Professor not found');
    prof.nomeCompleto = 'Usuário Removido';
    prof.email = `anon-${id}@removido.local`;
    prof.senhaHash = 'ANONYMIZED_ACCOUNT_LOCKED';
    return prof;
  }
}

export class TestQrCodeRepository implements IQrCodeRepository {
  private records: QrCodeResultDTO[] = [];

  async save(record: QrCodeResultDTO): Promise<QrCodeResultDTO> {
    this.records.push(record);
    return record;
  }

  async findByVersionAndStudent(
    examVersionId: string,
    studentId?: string
  ): Promise<QrCodeResultDTO | null> {
    return (
      this.records.find(
        (r) =>
          r.examVersionId === examVersionId &&
          (studentId ? r.studentId === studentId : !r.studentId)
      ) || null
    );
  }

  async findByPayload(rawPayload: string): Promise<QrCodeResultDTO | null> {
    return this.records.find((r) => r.qrCodePayload === rawPayload) || null;
  }

  async listByApplication(applicationId: string): Promise<QrCodeResultDTO[]> {
    return this.records.filter((r) => r.applicationId === applicationId);
  }
}

export class TestQuestionRepository implements IQuestionRepository {
  private questions: QuestionDTO[];

  constructor(seed: QuestionDTO[] = []) {
    this.questions = seed.map((q) => ({ ...q, alternatives: [...q.alternatives], tags: [...q.tags] }));
  }

  async findAll(filters?: QuestionFilterDTO): Promise<QuestionDTO[]> {
    let result = this.questions.filter((q) => !q.deletedAt);
    if (filters?.difficulty && filters.difficulty !== 'Todas') {
      result = result.filter((q) => q.difficulty.toLowerCase() === filters.difficulty!.toLowerCase());
    }
    if (filters?.tag && filters.tag !== 'Todas') {
      const tLower = filters.tag.toLowerCase();
      result = result.filter((q) => q.tags.some((t) => t.toLowerCase() === tLower));
    }
    if (filters?.discipline && filters.discipline !== 'Todas') {
      const dLower = filters.discipline.toLowerCase();
      result = result.filter((q) => q.discipline.toLowerCase() === dLower);
    }
    if (filters?.type && filters.type !== 'Todas') {
      result = result.filter((q) => q.type === filters.type);
    }
    if (filters?.search && filters.search.trim()) {
      const s = filters.search.trim().toLowerCase();
      result = result.filter(
        (q) =>
          q.statement.toLowerCase().includes(s) ||
          q.code.toLowerCase().includes(s) ||
          q.discipline.toLowerCase().includes(s) ||
          (q.topic && q.topic.toLowerCase().includes(s))
      );
    }
    return result;
  }

  async findById(id: string): Promise<QuestionDTO | null> {
    return this.questions.find((q) => q.id === id && !q.deletedAt) || null;
  }

  async create(data: CreateQuestionRequestDTO): Promise<QuestionDTO> {
    const id = `q-${crypto.randomUUID()}`;
    const letter = (data.correctAlternative || 'A') as AlternativeLetter;
    const gMap: Record<AlternativeLetter, string> = { A: 'ID-1', B: 'ID-2', C: 'ID-3', D: 'ID-4', E: 'ID-5' };
    const created: QuestionDTO = {
      id,
      teacherId: data.teacherId || 'teacher-test',
      code: data.code || `#Q-${this.questions.length + 1}`,
      type: data.type || 'objetiva',
      discipline: data.discipline.trim(),
      difficulty: data.difficulty,
      topic: data.topic?.trim() || 'Geral',
      tags: data.tags && data.tags.length > 0 ? data.tags : [data.discipline.trim()],
      statement: data.statement.trim(),
      alternatives: (data.alternatives || []).map((a, idx) => ({
        id: `${id}-alt-${idx}`,
        letter: a.letter,
        text: a.text.trim(),
        isCorrect: a.letter === letter,
      })),
      correctAlternative: letter,
      gabaritoDisplay: gMap[letter],
      points: data.points ?? 1.0,
      maxScore: data.maxScore ?? data.points ?? 1.0,
      explanation: data.explanation,
      createdAt: new Date().toISOString(),
    };
    this.questions.unshift(created);
    return created;
  }

  async update(id: string, data: UpdateQuestionRequestDTO): Promise<QuestionDTO | null> {
    const idx = this.questions.findIndex((q) => q.id === id && !q.deletedAt);
    if (idx === -1) return null;
    const prev = this.questions[idx];
    const next: QuestionDTO = {
      ...prev,
      ...data,
      alternatives: data.alternatives
        ? data.alternatives.map((a, i) => ({
            id: `${id}-alt-${i}`,
            letter: a.letter,
            text: a.text,
            isCorrect: a.letter === (data.correctAlternative || prev.correctAlternative),
          }))
        : prev.alternatives,
    };
    this.questions[idx] = next;
    return next;
  }

  async delete(id: string): Promise<boolean> {
    const q = this.questions.find((item) => item.id === id && !item.deletedAt);
    if (!q) return false;
    q.deletedAt = new Date().toISOString();
    return true;
  }

  async getAvailableTags(): Promise<string[]> {
    const set = new Set<string>();
    this.questions.filter((q) => !q.deletedAt).forEach((q) => q.tags.forEach((t) => set.add(t)));
    return ['Todas', ...Array.from(set)];
  }

  async getAvailableDisciplines(): Promise<string[]> {
    const set = new Set<string>();
    this.questions.filter((q) => !q.deletedAt).forEach((q) => set.add(q.discipline));
    return ['Todas', ...Array.from(set)];
  }
}

export class TestSettingsRepository implements ISettingsRepository {
  private map = new Map<string, SystemSettingsDTO>();

  private createDefault(teacherId: string): SystemSettingsDTO {
    return {
      id: `cfg-${teacherId}`,
      teacherId,
      institutionName: 'CATÓLICA DE SANTA CATARINA',
      department: '',
      professorName: '',
      professorEmail: '',
      passingGrade: 7.0,
      omrSensitivity: 'Alta (Threshold 0.65)',
      omrThreshold: 0.65,
      autoRotate: true,
      updatedAt: new Date().toISOString(),
    };
  }

  async getSettings(teacherId: string): Promise<SystemSettingsDTO> {
    if (!this.map.has(teacherId)) {
      this.map.set(teacherId, this.createDefault(teacherId));
    }
    return { ...this.map.get(teacherId)! };
  }

  async updateSettings(
    teacherId: string,
    data: UpdateSettingsRequestDTO & { omrThreshold?: number; passingGrade?: number }
  ): Promise<SystemSettingsDTO> {
    const current = await this.getSettings(teacherId);
    const updated: SystemSettingsDTO = {
      ...current,
      institutionName: data.institutionName !== undefined ? data.institutionName.trim() : current.institutionName,
      department: data.department !== undefined ? data.department.trim() : current.department,
      professorName: data.professorName !== undefined ? data.professorName.trim() : current.professorName,
      professorEmail: data.professorEmail !== undefined ? data.professorEmail.trim() : current.professorEmail,
      passingGrade: typeof data.passingGrade === 'number' ? data.passingGrade : current.passingGrade,
      omrSensitivity: (data.omrSensitivity as OmrSensitivityLabel) ?? current.omrSensitivity,
      omrThreshold: data.omrThreshold ?? current.omrThreshold,
      autoRotate: data.autoRotate !== undefined ? Boolean(data.autoRotate) : current.autoRotate,
      updatedAt: new Date().toISOString(),
    };
    this.map.set(teacherId, updated);
    return { ...updated };
  }

  async resetSettings(teacherId: string): Promise<SystemSettingsDTO> {
    const fresh = this.createDefault(teacherId);
    this.map.set(teacherId, fresh);
    return { ...fresh };
  }

  async anonymizeTeacher(teacherId: string): Promise<AnonymizeTeacherResponseDTO> {
    const current = await this.getSettings(teacherId);
    const anonymizedAt = new Date().toISOString();
    const updated: SystemSettingsDTO = {
      ...current,
      professorName: 'Usuário Removido',
      professorEmail: `anon-${teacherId}@removido.local`,
      updatedAt: anonymizedAt,
    };
    this.map.set(teacherId, updated);
    return {
      teacherId,
      professorName: updated.professorName,
      professorEmail: updated.professorEmail,
      anonymizedAt,
      message: 'Os dados pessoais do docente foram anonimizados com sucesso (LGPD).',
    };
  }
}

export class TestStudentRepository implements IStudentRepository {
  public students: StudentDTO[];

  constructor(seed: StudentDTO[] = []) {
    this.students = seed.map((s) => ({ ...s }));
  }

  private computeStatus(avg: number): 'approved' | 'warning' | 'failed' {
    if (avg >= 7.0) return 'approved';
    if (avg >= 5.0) return 'warning';
    return 'failed';
  }

  async findAll(filters?: StudentFilterDTO): Promise<StudentDTO[]> {
    let result = [...this.students];
    if (filters?.discipline && filters.discipline !== 'Todas') {
      const d = filters.discipline.toLowerCase();
      result = result.filter((s) => s.discipline.toLowerCase() === d || s.course.toLowerCase().includes(d));
    }
    if (filters?.classGroup && filters.classGroup !== 'Todas') {
      const c = filters.classGroup.toLowerCase();
      result = result.filter((s) => s.classGroup.toLowerCase() === c);
    }
    if (filters?.course && filters.course !== 'Todos') {
      const c = filters.course.toLowerCase();
      result = result.filter((s) => s.course.toLowerCase() === c);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.registration.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }
    return result;
  }

  async findById(id: string): Promise<StudentDTO | null> {
    return this.students.find((s) => s.id === id) || null;
  }

  async findByRegistration(registration: string): Promise<StudentDTO | null> {
    const clean = registration.trim();
    return this.students.find((s) => s.registration === clean) || null;
  }

  async create(data: CreateStudentRequestDTO): Promise<StudentDTO> {
    const avg = data.overallAverage ?? 0;
    const item: StudentDTO = {
      id: `std-${crypto.randomUUID()}`,
      name: data.name.trim(),
      registration: data.registration.trim(),
      course: (data.course || 'Direito').trim(),
      email: data.email.trim(),
      classGroup: (data.classGroup || 'Turma A').trim(),
      classId: data.classId || undefined,
      discipline: (data.discipline || 'Direito Constitucional').trim(),
      examsTaken: data.examsTaken ?? 0,
      overallAverage: avg,
      status: this.computeStatus(avg),
      createdAt: new Date().toISOString(),
    };
    this.students.unshift(item);
    return item;
  }

  async update(id: string, data: UpdateStudentRequestDTO): Promise<StudentDTO | null> {
    const idx = this.students.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    const prev = this.students[idx];
    const avg = data.overallAverage ?? prev.overallAverage;
    const next: StudentDTO = {
      ...prev,
      ...data,
      overallAverage: avg,
      status: this.computeStatus(avg),
    };
    this.students[idx] = next;
    return next;
  }

  async delete(id: string): Promise<boolean> {
    const before = this.students.length;
    this.students = this.students.filter((s) => s.id !== id);
    return this.students.length < before;
  }

  async deleteBatch(ids: string[]): Promise<number> {
    const before = this.students.length;
    this.students = this.students.filter((s) => !ids.includes(s.id));
    return before - this.students.length;
  }

  async importBatch(students: CreateStudentRequestDTO[]): Promise<StudentDTO[]> {
    const out: StudentDTO[] = [];
    for (const s of students) out.push(await this.create(s));
    return out;
  }

  async getDistinctDisciplines(): Promise<string[]> {
    return ['Todas', ...Array.from(new Set(this.students.map((s) => s.discipline)))];
  }
}

export class TestExamRepository implements IExamRepository {
  private exams: ExamRecordDTO[];
  private baseQuestions: ExamQuestionLayoutDTO[];

  constructor(exams: ExamRecordDTO[] = [], baseQuestions: ExamQuestionLayoutDTO[] = []) {
    this.exams = exams.map((e) => ({ ...e }));
    this.baseQuestions = baseQuestions;
  }

  async listExams(disciplinaId?: string): Promise<ExamRecordDTO[]> {
    return disciplinaId
      ? this.exams.filter((e) => e.disciplinaId === disciplinaId)
      : [...this.exams];
  }

  async findExamById(id: string): Promise<ExamRecordDTO | null> {
    return this.exams.find((e) => e.id === id) || null;
  }

  async createExam(data: CreateExamDTO): Promise<ExamRecordDTO> {
    const rec: ExamRecordDTO = {
      id: data.id || `exam-${crypto.randomUUID()}`,
      code: data.code || `#TEST-${this.exams.length + 1}`,
      title: data.title,
      subtitle: data.subtitle || '',
      institution: data.institution,
      department: data.department,
      course: data.course,
      discipline: data.discipline,
      disciplinaId: data.disciplinaId ?? null,
      classGroup: data.classGroup,
      semester: data.semester,
      date: data.date,
      duration: data.duration,
      instructions: data.instructions,
      includeBoxNota: data.includeBoxNota ?? false,
      variationsJson: data.variationsJson,
      createdAt: new Date(),
    };
    this.exams.unshift(rec);
    return rec;
  }

  async updateExam(id: string, data: UpdateExamDTO): Promise<ExamRecordDTO> {
    const idx = this.exams.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error(`Exam not found: ${id}`);
    this.exams[idx] = { ...this.exams[idx], ...data };
    return this.exams[idx];
  }

  async deleteExam(id: string): Promise<boolean> {
    const before = this.exams.length;
    this.exams = this.exams.filter((e) => e.id !== id);
    return this.exams.length < before;
  }

  async getExamById(id: string): Promise<ExamLayoutDTO | null> {
    return this.getExamLayout(id, 'A');
  }

  async getExamHeader(id: string): Promise<ExamHeaderDTO | null> {
    const exam = await this.findExamById(id);
    if (!exam) return null;
    return {
      institution: exam.institution,
      department: exam.department,
      course: exam.course,
      discipline: exam.discipline,
      classGroup: exam.classGroup,
      semester: exam.semester,
      title: exam.title,
      subtitle: exam.subtitle,
      code: exam.code,
      date: exam.date,
      duration: exam.duration,
      instructions: exam.instructions,
      includeBoxNota: exam.includeBoxNota,
    };
  }

  async getExamQuestions(
    id: string,
    versionLetter: ExamVersionLetter = 'A'
  ): Promise<ExamQuestionLayoutDTO[]> {
    const exam = await this.findExamById(id);
    if (!exam) return [];
    const qs = [...this.baseQuestions];
    if (qs.length <= 1 || versionLetter === 'A') return qs;
    const shift = (versionLetter.charCodeAt(0) - 65) % qs.length;
    const rotated = [...qs.slice(shift), ...qs.slice(0, shift)];
    return rotated.map((q, idx) => ({ ...q, orderIndex: idx + 1 }));
  }

  async getExamLayout(
    id: string,
    versionLetter: ExamVersionLetter = 'A'
  ): Promise<ExamLayoutDTO | null> {
    const header = await this.getExamHeader(id);
    if (!header) return null;
    const questions = await this.getExamQuestions(id, versionLetter);
    const isSingle = id === 'exam-single-page';
    const pages: ExamPageDTO[] = isSingle
      ? [
          {
            pageNumber: 1,
            totalPages: 1,
            versionLetter,
            isFirstPage: true,
            header,
            questions: questions.slice(0, 2),
          },
        ]
      : [
          {
            pageNumber: 1,
            totalPages: 2,
            versionLetter,
            isFirstPage: true,
            header,
            questions: questions.slice(0, 3),
          },
          {
            pageNumber: 2,
            totalPages: 2,
            versionLetter,
            isFirstPage: false,
            questions: questions.slice(3),
          },
        ];
    const answerKey: Record<number, 'A' | 'B' | 'C' | 'D' | 'E'> = {};
    pages.flatMap((p) => p.questions).forEach((q) => {
      answerKey[q.orderIndex] = q.correctAlternative;
    });
    return {
      examId: id,
      title: header.title,
      versionLetter,
      pageSize: 'A4',
      dimensionsMm: { width: 210, height: 297 },
      dimensionsPx: { width: 794, height: 1123 },
      marginsMm: { top: 15, bottom: 15, left: 15, right: 15 },
      header,
      totalPages: pages.length,
      pages,
      qrCodePayload: JSON.stringify({ app: 'CORREGE', examId: id, code: header.code, ver: versionLetter }),
      answerKey,
    };
  }
}

export class TestExamVariationRepository implements IExamVariationRepository {
  private stored = new Map<string, ExamVariationResultDTO>();
  private questions: VariationQuestionDTO[];

  constructor(questions: VariationQuestionDTO[]) {
    this.questions = questions;
  }

  async getBaseQuestions(_examId: string): Promise<VariationQuestionDTO[]> {
    return this.questions;
  }

  async saveVariations(examId: string, result: ExamVariationResultDTO): Promise<void> {
    this.stored.set(examId, result);
  }

  async getVariations(examId: string): Promise<ExamVariationResultDTO | null> {
    return this.stored.get(examId) || null;
  }
}
