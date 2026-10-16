import { Turma } from '@prisma/client';
import { CreateTurmaDTO, ITurmaRepository, TurmaWithRelations, UpdateTurmaDTO } from '../interfaces/ITurmaRepository';

export class MockTurmaRepository implements ITurmaRepository {
  private turmas: TurmaWithRelations[] = [
    {
      id: 'class-1',
      idProfessor: 'prof-catolica-01',
      idDisciplina: 'disc-1',
      nome: 'Turma A - Matutino',
      periodoLetivo: '2026.1',
      status: 'ativa',
      disciplina: {
        id: 'disc-1',
        nome: 'Direito Constitucional I',
        codigo: 'DIR-101',
        curso: 'Direito',
      },
      _count: {
        students: 38,
      },
    },
    {
      id: 'class-2',
      idProfessor: 'prof-catolica-01',
      idDisciplina: 'disc-1',
      nome: 'Turma B - Noturno',
      periodoLetivo: '2026.1',
      status: 'ativa',
      disciplina: {
        id: 'disc-1',
        nome: 'Direito Constitucional I',
        codigo: 'DIR-101',
        curso: 'Direito',
      },
      _count: {
        students: 34,
      },
    },
    {
      id: 'class-3',
      idProfessor: 'prof-catolica-01',
      idDisciplina: 'disc-2',
      nome: 'Turma Única - Integral',
      periodoLetivo: '2026.1',
      status: 'ativa',
      disciplina: {
        id: 'disc-2',
        nome: 'Cálculo Diferencial e Integral I',
        codigo: 'MAT-201',
        curso: 'Engenharia de Software',
      },
      _count: {
        students: 42,
      },
    },
  ];

  async list(idProfessor?: string): Promise<TurmaWithRelations[]> {
    if (idProfessor) {
      return this.turmas.filter((t) => t.idProfessor === idProfessor);
    }
    return [...this.turmas];
  }

  async findById(id: string): Promise<TurmaWithRelations | null> {
    return this.turmas.find((t) => t.id === id) || null;
  }

  async create(data: CreateTurmaDTO): Promise<Turma> {
    const item: TurmaWithRelations = {
      id: `class-${Date.now()}`,
      idProfessor: data.idProfessor,
      idDisciplina: data.idDisciplina,
      nome: data.nome,
      periodoLetivo: data.periodoLetivo,
      status: data.status || 'ativa',
      disciplina: {
        id: data.idDisciplina,
        nome: 'Disciplina Vinculada',
        codigo: 'DISC',
        curso: 'Geral',
      },
      _count: {
        students: 0,
      },
    };
    this.turmas.push(item);
    return item;
  }

  async update(id: string, data: UpdateTurmaDTO): Promise<Turma> {
    const index = this.turmas.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Turma com ID ${id} não encontrada.`);
    }
    this.turmas[index] = {
      ...this.turmas[index],
      ...data,
    };
    return this.turmas[index];
  }

  async delete(id: string): Promise<boolean> {
    const prev = this.turmas.length;
    this.turmas = this.turmas.filter((t) => t.id !== id);
    return this.turmas.length < prev;
  }
}
