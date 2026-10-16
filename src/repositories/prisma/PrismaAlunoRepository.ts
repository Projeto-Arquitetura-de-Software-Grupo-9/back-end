import { Aluno } from '@prisma/client';
import { prisma } from '../../config/database';
import { CreateAlunoDTO, IAlunoRepository, UpdateAlunoDTO } from '../interfaces/IAlunoRepository';

export class PrismaAlunoRepository implements IAlunoRepository {
  async listByTurma(idTurma: string): Promise<Aluno[]> {
    return prisma.aluno.findMany({
      where: { idTurma },
      orderBy: { nome: 'asc' },
    });
  }

  async listAll(): Promise<Aluno[]> {
    return prisma.aluno.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: string): Promise<Aluno | null> {
    return prisma.aluno.findUnique({
      where: { id },
    });
  }

  async findByMatricula(matricula: string): Promise<Aluno | null> {
    return prisma.aluno.findFirst({
      where: { matricula },
    });
  }

  async create(data: CreateAlunoDTO): Promise<Aluno> {
    return prisma.aluno.create({
      data,
    });
  }

  async createMany(data: CreateAlunoDTO[]): Promise<{ count: number }> {
    return prisma.aluno.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async update(id: string, data: UpdateAlunoDTO): Promise<Aluno> {
    return prisma.aluno.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await prisma.aluno.delete({
      where: { id },
    });
    return !!deleted;
  }
}
