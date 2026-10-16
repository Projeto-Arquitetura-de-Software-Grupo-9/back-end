import {
  CreateStudentRequestDTO,
  StudentDTO,
  StudentFilterDTO,
  UpdateStudentRequestDTO,
} from '../../types/student.dto';
import { IStudentRepository } from '../interfaces/IStudentRepository';

export class MockStudentRepository implements IStudentRepository {
  private students: StudentDTO[] = [
    {
      id: 'std-1',
      name: 'Amanda Dolores',
      registration: '2024.1.001',
      course: 'Direito',
      email: 'amanda.dolores@universidade.edu.br',
      classGroup: 'Turma A',
      discipline: 'Direito Constitucional',
      examsTaken: 12,
      overallAverage: 9.2,
      status: 'approved',
      createdAt: '2026-02-01T08:00:00Z',
    },
    {
      id: 'std-2',
      name: 'Bruno Cortela',
      registration: '2024.1.045',
      course: 'Direito',
      email: 'bruno.cortela@universidade.edu.br',
      classGroup: 'Turma B',
      discipline: 'Direito Penal',
      examsTaken: 11,
      overallAverage: 6.8,
      status: 'warning',
      createdAt: '2026-02-01T08:05:00Z',
    },
    {
      id: 'std-3',
      name: 'Cleber Santana',
      registration: '2024.1.089',
      course: 'Direito',
      email: 'cleber.santana@universidade.edu.br',
      classGroup: 'Turma A',
      discipline: 'Direito Civil',
      examsTaken: 12,
      overallAverage: 8.5,
      status: 'approved',
      createdAt: '2026-02-01T08:10:00Z',
    },
    {
      id: 'std-4',
      name: 'Julio Balestrin',
      registration: '2024.1.102',
      course: 'Direito',
      email: 'julio.balestrin@universidade.edu.br',
      classGroup: 'Turma A',
      discipline: 'Direito Constitucional',
      examsTaken: 10,
      overallAverage: 5.5,
      status: 'warning',
      createdAt: '2026-02-01T08:15:00Z',
    },
    {
      id: 'std-5',
      name: 'Moacir Neto',
      registration: '2024.1.103',
      course: 'Direito',
      email: 'moacir.neto@universidade.edu.br',
      classGroup: 'Turma A',
      discipline: 'Direito Constitucional',
      examsTaken: 10,
      overallAverage: 7.5,
      status: 'approved',
      createdAt: '2026-02-01T08:20:00Z',
    },
    {
      id: 'std-6',
      name: 'Alberto Einstein',
      registration: '2024.1.104',
      course: 'Direito',
      email: 'alberto.einstein@universidade.edu.br',
      classGroup: 'Turma A',
      discipline: 'Direito Internacional',
      examsTaken: 10,
      overallAverage: 10.0,
      status: 'approved',
      createdAt: '2026-02-01T08:25:00Z',
    },
    {
      id: 'std-7',
      name: 'Beatriz Vasconcelos',
      registration: '2024.1.115',
      course: 'Direito',
      email: 'beatriz.v@universidade.edu.br',
      classGroup: 'Turma C',
      discipline: 'Direito Constitucional',
      examsTaken: 9,
      overallAverage: 7.8,
      status: 'approved',
      createdAt: '2026-02-01T08:30:00Z',
    },
    {
      id: 'std-8',
      name: 'Guilherme Siqueira',
      registration: '2024.1.120',
      course: 'Direito',
      email: 'guilherme.s@universidade.edu.br',
      classGroup: 'Turma B',
      discipline: 'Direito Administrativo',
      examsTaken: 12,
      overallAverage: 8.9,
      status: 'approved',
      createdAt: '2026-02-01T08:35:00Z',
    },
    {
      id: 'std-9',
      name: 'Mariana Duarte',
      registration: '2024.1.144',
      course: 'Direito',
      email: 'mariana.d@universidade.edu.br',
      classGroup: 'Turma A',
      discipline: 'Direito do Trabalho',
      examsTaken: 11,
      overallAverage: 7.4,
      status: 'approved',
      createdAt: '2026-02-01T08:40:00Z',
    },
    {
      id: 'std-10',
      name: 'Rodrigo Faro',
      registration: '2024.1.150',
      course: 'Direito',
      email: 'rodrigo.f@universidade.edu.br',
      classGroup: 'Turma D',
      discipline: 'Direito Tributário',
      examsTaken: 8,
      overallAverage: 6.8,
      status: 'warning',
      createdAt: '2026-02-01T08:45:00Z',
    },
  ];

  private computeStatus(average: number): 'approved' | 'warning' | 'failed' {
    if (average >= 7.0) return 'approved';
    if (average >= 5.0) return 'warning';
    return 'failed';
  }

  async findAll(filters?: StudentFilterDTO): Promise<StudentDTO[]> {
    let result = [...this.students];

    if (filters?.discipline && filters.discipline !== 'Todas') {
      const discLower = filters.discipline.toLowerCase();
      result = result.filter(
        (s) =>
          s.discipline.toLowerCase() === discLower ||
          s.course.toLowerCase().includes(discLower)
      );
    }

    if (filters?.classGroup && filters.classGroup !== 'Todas') {
      result = result.filter(
        (s) => s.classGroup.toLowerCase() === filters.classGroup!.toLowerCase()
      );
    }

    if (filters?.course && filters.course !== 'Todos') {
      result = result.filter(
        (s) => s.course.toLowerCase() === filters.course!.toLowerCase()
      );
    }

    if (filters?.search && filters.search.trim() !== '') {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.registration.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.course.toLowerCase().includes(q)
      );
    }

    return result.map((s) => ({
      ...s,
      status: this.computeStatus(s.overallAverage),
    }));
  }

  async findById(id: string): Promise<StudentDTO | null> {
    const found = this.students.find((s) => s.id === id);
    if (!found) return null;
    return {
      ...found,
      status: this.computeStatus(found.overallAverage),
    };
  }

  async findByRegistration(registration: string): Promise<StudentDTO | null> {
    const found = this.students.find(
      (s) => s.registration.toLowerCase() === registration.trim().toLowerCase()
    );
    if (!found) return null;
    return {
      ...found,
      status: this.computeStatus(found.overallAverage),
    };
  }

  async create(data: CreateStudentRequestDTO): Promise<StudentDTO> {
    const overallAverage =
      data.overallAverage !== undefined ? Number(data.overallAverage) : 0.0;
    const newStudent: StudentDTO = {
      id: `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: data.name.trim(),
      registration: data.registration.trim(),
      course: (data.course || 'Direito').trim(),
      email: data.email.trim(),
      classGroup: (data.classGroup || 'Turma A').trim(),
      classId: data.classId,
      discipline: (data.discipline || 'Direito Constitucional').trim(),
      examsTaken: data.examsTaken !== undefined ? Number(data.examsTaken) : 0,
      overallAverage,
      status: this.computeStatus(overallAverage),
      createdAt: new Date().toISOString(),
    };

    this.students.unshift(newStudent);
    return { ...newStudent };
  }

  async update(
    id: string,
    data: UpdateStudentRequestDTO
  ): Promise<StudentDTO | null> {
    const index = this.students.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const existing = this.students[index];
    const overallAverage =
      data.overallAverage !== undefined
        ? Number(data.overallAverage)
        : existing.overallAverage;

    const updated: StudentDTO = {
      ...existing,
      name: data.name !== undefined ? data.name.trim() : existing.name,
      registration:
        data.registration !== undefined
          ? data.registration.trim()
          : existing.registration,
      course: data.course !== undefined ? data.course.trim() : existing.course,
      email: data.email !== undefined ? data.email.trim() : existing.email,
      classGroup:
        data.classGroup !== undefined
          ? data.classGroup.trim()
          : existing.classGroup,
      classId: data.classId !== undefined ? data.classId : existing.classId,
      discipline:
        data.discipline !== undefined
          ? data.discipline.trim()
          : existing.discipline,
      examsTaken:
        data.examsTaken !== undefined
          ? Number(data.examsTaken)
          : existing.examsTaken,
      overallAverage,
      status: this.computeStatus(overallAverage),
    };

    this.students[index] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    const initialLength = this.students.length;
    this.students = this.students.filter((s) => s.id !== id);
    return this.students.length < initialLength;
  }

  async deleteBatch(ids: string[]): Promise<number> {
    const idSet = new Set(ids);
    const initialLength = this.students.length;
    this.students = this.students.filter((s) => !idSet.has(s.id));
    return initialLength - this.students.length;
  }

  async importBatch(students: CreateStudentRequestDTO[]): Promise<StudentDTO[]> {
    const created: StudentDTO[] = [];
    for (let i = 0; i < students.length; i++) {
      const row = students[i];
      const overallAverage =
        row.overallAverage !== undefined ? Number(row.overallAverage) : 0.0;
      const item: StudentDTO = {
        id: `std-imp-${Date.now()}-${i}`,
        name: row.name.trim(),
        registration: row.registration.trim(),
        course: (row.course || 'Direito').trim(),
        email: row.email.trim(),
        classGroup: (row.classGroup || 'Turma A').trim(),
        classId: row.classId,
        discipline: (row.discipline || 'Direito Constitucional').trim(),
        examsTaken: row.examsTaken !== undefined ? Number(row.examsTaken) : 0,
        overallAverage,
        status: this.computeStatus(overallAverage),
        createdAt: new Date().toISOString(),
      };
      created.push(item);
    }

    this.students = [...created, ...this.students];
    return created;
  }

  async getDistinctDisciplines(): Promise<string[]> {
    const set = new Set<string>(this.students.map((s) => s.discipline));
    return ['Todas', ...Array.from(set)];
  }
}
