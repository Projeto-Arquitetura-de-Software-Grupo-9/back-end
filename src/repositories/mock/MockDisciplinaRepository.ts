import { Disciplina } from '@prisma/client';
import { CreateDisciplinaDTO, IDisciplinaRepository, UpdateDisciplinaDTO } from '../interfaces/IDisciplinaRepository';

export class MockDisciplinaRepository implements IDisciplinaRepository {
  private disciplinas: Disciplina[] = [
    {
      id: 'disc-1',
      idProfessor: 'prof-catolica-01',
      codigo: 'DIR-101',
      nome: 'Direito Constitucional I',
      curso: 'Direito',
    },
    {
      id: 'disc-2',
      idProfessor: 'prof-catolica-01',
      codigo: 'MAT-201',
      nome: 'Cálculo Diferencial e Integral I',
      curso: 'Engenharia de Software',
    },
    {
      id: 'disc-3',
      idProfessor: 'prof-catolica-01',
      codigo: 'CC-102',
      nome: 'Algoritmos e Estruturas de Dados',
      curso: 'Sistemas de Informação',
    },
    {
      id: 'disc-4',
      idProfessor: 'prof-catolica-01',
      codigo: 'DIR-302',
      nome: 'Sociedades Empresariais e Direito de Reestruturação',
      curso: 'Direito',
    },
  ];

  async list(idProfessor?: string): Promise<Disciplina[]> {
    if (idProfessor) {
      return this.disciplinas.filter((d) => d.idProfessor === idProfessor);
    }
    return [...this.disciplinas];
  }

  async findById(id: string): Promise<Disciplina | null> {
    return this.disciplinas.find((d) => d.id === id) || null;
  }

  async create(data: CreateDisciplinaDTO): Promise<Disciplina> {
    const item: Disciplina = {
      id: `disc-${Date.now()}`,
      idProfessor: data.idProfessor,
      codigo: data.codigo,
      nome: data.nome,
      curso: data.curso,
    };
    this.disciplinas.push(item);
    return item;
  }

  async update(id: string, data: UpdateDisciplinaDTO): Promise<Disciplina> {
    const index = this.disciplinas.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error(`Disciplina com ID ${id} não encontrada.`);
    }
    this.disciplinas[index] = {
      ...this.disciplinas[index],
      ...data,
    };
    return this.disciplinas[index];
  }

  async delete(id: string): Promise<boolean> {
    const prevLen = this.disciplinas.length;
    this.disciplinas = this.disciplinas.filter((d) => d.id !== id);
    return this.disciplinas.length < prevLen;
  }
}
