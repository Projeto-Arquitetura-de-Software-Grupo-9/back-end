import { Turma } from '@prisma/client';
import { prisma } from '../../config/database';
import { CreateTurmaDTO, ITurmaRepository, TurmaWithRelations, UpdateTurmaDTO } from '../interfaces/ITurmaRepository';

export class PrismaTurmaRepository implements ITurmaRepository {
  async list(idProfessor?: string): Promise<TurmaWithRelations[]> {
    return prisma.turma.findMany({
      where: idProfessor ? { idProfessor } : undefined,
      include: {
        disciplina: {
          select: { id: true, nome: true, codigo: true, curso: true },
        },
        _count: {
          select: { students: true },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: string): Promise<TurmaWithRelations | null> {
    return prisma.turma.findUnique({
      where: { id },
      include: {
        disciplina: {
          select: { id: true, nome: true, codigo: true, curso: true },
        },
        _count: {
          select: { students: true },
        },
      },
    });
  }

  async create(data: CreateTurmaDTO): Promise<Turma> {
    return prisma.turma.create({
      data: {
        idProfessor: data.idProfessor,
        idDisciplina: data.idDisciplina,
        nome: data.nome,
        periodoLetivo: data.periodoLetivo,
        status: data.status || 'ativa',
      },
    });
  }

  async update(id: string, data: UpdateTurmaDTO): Promise<Turma> {
    return prisma.turma.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await prisma.turma.delete({
      where: { id },
    });
    return !!deleted;
  }
}
