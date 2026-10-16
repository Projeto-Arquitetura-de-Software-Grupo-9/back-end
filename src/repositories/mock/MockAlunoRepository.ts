import { Aluno } from '@prisma/client';
import { CreateAlunoDTO, IAlunoRepository, UpdateAlunoDTO } from '../interfaces/IAlunoRepository';

export class MockAlunoRepository implements IAlunoRepository {
  private alunos: Aluno[] = [
    {
      id: 'std-1',
      idTurma: 'class-1',
      nome: 'Lucas Ferreira Lima',
      matricula: '2024.1.001',
      email: 'lucas.lima@catolicasc.edu.br',
      curso: 'Direito',
    },
    {
      id: 'std-2',
      idTurma: 'class-1',
      nome: 'Ana Beatriz Silveira',
      matricula: '2024.1.002',
      email: 'ana.silveira@catolicasc.edu.br',
      curso: 'Direito',
    },
    {
      id: 'std-3',
      idTurma: 'class-1',
      nome: 'Gabriel Henrique Santos',
      matricula: '2024.1.003',
      email: 'gabriel.santos@catolicasc.edu.br',
      curso: 'Direito',
    },
    {
      id: 'std-4',
      idTurma: 'class-2',
      nome: 'Mariana Costa Oliveira',
      matricula: '2024.1.004',
      email: 'mariana.costa@catolicasc.edu.br',
      curso: 'Direito',
    },
    {
      id: 'std-5',
      idTurma: 'class-2',
      nome: 'Felipe Augusto Rocha',
      matricula: '2024.1.005',
      email: 'felipe.rocha@catolicasc.edu.br',
      curso: 'Direito',
    },
  ];

  async listByTurma(idTurma: string): Promise<Aluno[]> {
    return this.alunos.filter((a) => a.idTurma === idTurma);
  }

  async listAll(): Promise<Aluno[]> {
    return [...this.alunos];
  }

  async findById(id: string): Promise<Aluno | null> {
    return this.alunos.find((a) => a.id === id) || null;
  }

  async findByMatricula(matricula: string): Promise<Aluno | null> {
    return this.alunos.find((a) => a.matricula.trim() === matricula.trim()) || null;
  }

  async create(data: CreateAlunoDTO): Promise<Aluno> {
    const item: Aluno = {
      id: `std-${Date.now()}`,
      idTurma: data.idTurma,
      nome: data.nome,
      matricula: data.matricula,
      email: data.email,
      curso: data.curso,
    };
    this.alunos.push(item);
    return item;
  }

  async createMany(data: CreateAlunoDTO[]): Promise<{ count: number }> {
    let count = 0;
    for (const d of data) {
      await this.create(d);
      count++;
    }
    return { count };
  }

  async update(id: string, data: UpdateAlunoDTO): Promise<Aluno> {
    const idx = this.alunos.findIndex((a) => a.id === id);
    if (idx === -1) {
      throw new Error(`Aluno com ID ${id} não encontrado.`);
    }
    this.alunos[idx] = {
      ...this.alunos[idx],
      ...data,
    };
    return this.alunos[idx];
  }

  async delete(id: string): Promise<boolean> {
    const prev = this.alunos.length;
    this.alunos = this.alunos.filter((a) => a.id !== id);
    return this.alunos.length < prev;
  }
}
