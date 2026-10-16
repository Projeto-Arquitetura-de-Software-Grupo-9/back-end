import { prisma } from '../../config/database';
import {
  CreateStudentRequestDTO,
  StudentDTO,
  StudentFilterDTO,
  UpdateStudentRequestDTO,
} from '../../types/student.dto';
import { IStudentRepository } from '../interfaces/IStudentRepository';

export class PrismaStudentRepository implements IStudentRepository {
  private computeStatus(average: number): 'approved' | 'warning' | 'failed' {
    if (average >= 7.0) return 'approved';
    if (average >= 5.0) return 'warning';
    return 'failed';
  }

  private mapToDTO(row: any): StudentDTO {
    return {
      id: row.id,
      name: row.name,
      registration: row.registration,
      course: row.course,
      email: row.email,
      classGroup: row.classGroup,
      classId: row.classId || undefined,
      discipline: row.discipline,
      examsTaken: row.examsTaken,
      overallAverage: row.overallAverage,
      status: this.computeStatus(row.overallAverage),
      createdAt: row.createdAt.toISOString(),
    };
  }

  async findAll(filters?: StudentFilterDTO): Promise<StudentDTO[]> {
    const rows = await prisma.student.findMany({
      orderBy: { createdAt: 'desc' },
    });

    let result = rows.map((r) => this.mapToDTO(r));

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

    return result;
  }

  async findById(id: string): Promise<StudentDTO | null> {
    const found = await prisma.student.findUnique({ where: { id } });
    return found ? this.mapToDTO(found) : null;
  }

  async findByRegistration(registration: string): Promise<StudentDTO | null> {
    const found = await prisma.student.findFirst({
      where: { registration: registration.trim() },
    });
    return found ? this.mapToDTO(found) : null;
  }

  async create(data: CreateStudentRequestDTO): Promise<StudentDTO> {
    const created = await prisma.student.create({
      data: {
        name: data.name.trim(),
        registration: data.registration.trim(),
        course: (data.course || 'Direito').trim(),
        email: data.email.trim(),
        classGroup: (data.classGroup || 'Turma A').trim(),
        classId: data.classId || null,
        discipline: (data.discipline || 'Direito Constitucional').trim(),
        examsTaken: data.examsTaken !== undefined ? Number(data.examsTaken) : 0,
        overallAverage:
          data.overallAverage !== undefined ? Number(data.overallAverage) : 0.0,
      },
    });

    return this.mapToDTO(created);
  }

  async update(
    id: string,
    data: UpdateStudentRequestDTO
  ): Promise<StudentDTO | null> {
    const exists = await prisma.student.findUnique({ where: { id } });
    if (!exists) return null;

    const updated = await prisma.student.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        registration:
          data.registration !== undefined
            ? data.registration.trim()
            : undefined,
        course: data.course !== undefined ? data.course.trim() : undefined,
        email: data.email !== undefined ? data.email.trim() : undefined,
        classGroup:
          data.classGroup !== undefined ? data.classGroup.trim() : undefined,
        classId: data.classId !== undefined ? data.classId : undefined,
        discipline:
          data.discipline !== undefined ? data.discipline.trim() : undefined,
        examsTaken:
          data.examsTaken !== undefined ? Number(data.examsTaken) : undefined,
        overallAverage:
          data.overallAverage !== undefined
            ? Number(data.overallAverage)
            : undefined,
      },
    });

    return this.mapToDTO(updated);
  }

  async delete(id: string): Promise<boolean> {
    const exists = await prisma.student.findUnique({ where: { id } });
    if (!exists) return false;
    await prisma.student.delete({ where: { id } });
    return true;
  }

  async deleteBatch(ids: string[]): Promise<number> {
    const res = await prisma.student.deleteMany({
      where: { id: { in: ids } },
    });
    return res.count;
  }

  async importBatch(students: CreateStudentRequestDTO[]): Promise<StudentDTO[]> {
    const created: StudentDTO[] = [];
    for (const row of students) {
      const item = await this.create(row);
      created.push(item);
    }
    return created;
  }

  async getDistinctDisciplines(): Promise<string[]> {
    const rows = await prisma.student.findMany({
      select: { discipline: true },
      distinct: ['discipline'],
    });
    return ['Todas', ...rows.map((r) => r.discipline)];
  }
}
