import { Professor } from '@prisma/client';
import { prisma } from '../../config/database';
import { CreateProfessorDTO, IProfessorRepository } from '../interfaces/IProfessorRepository';

export class PrismaProfessorRepository implements IProfessorRepository {
  async findById(id: string): Promise<Professor | null> {
    return prisma.professor.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<Professor | null> {
    return prisma.professor.findUnique({
      where: { email },
    });
  }

  async create(data: CreateProfessorDTO): Promise<Professor> {
    return prisma.professor.create({
      data,
    });
  }
}
