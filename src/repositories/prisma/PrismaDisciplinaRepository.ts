import { Disciplina } from '@prisma/client';
import { prisma } from '../../config/database';
import { CreateDisciplinaDTO, IDisciplinaRepository, UpdateDisciplinaDTO } from '../interfaces/IDisciplinaRepository';

export class PrismaDisciplinaRepository implements IDisciplinaRepository {
  async list(idProfessor?: string): Promise<Disciplina[]> {
    return prisma.disciplina.findMany({
      where: idProfessor ? { idProfessor } : undefined,
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: string): Promise<Disciplina | null> {
    return prisma.disciplina.findUnique({
      where: { id },
    });
  }

  async create(data: CreateDisciplinaDTO): Promise<Disciplina> {
    return prisma.disciplina.create({
      data,
    });
  }

  async update(id: string, data: UpdateDisciplinaDTO): Promise<Disciplina> {
    return prisma.disciplina.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await prisma.disciplina.delete({
      where: { id },
    });
    return !!deleted;
  }
}
