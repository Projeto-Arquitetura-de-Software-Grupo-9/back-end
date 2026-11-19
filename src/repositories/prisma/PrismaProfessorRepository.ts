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
    const normalized = email.trim().toLowerCase();
    return prisma.professor.findUnique({
      where: { email: normalized },
    });
  }

  async create(data: CreateProfessorDTO): Promise<Professor> {
    return prisma.professor.create({
      data: {
        nomeCompleto: data.nomeCompleto.trim(),
        email: data.email.trim().toLowerCase(),
        senhaHash: data.senhaHash,
      },
    });
  }

  async updatePassword(id: string, senhaHash: string): Promise<Professor> {
    return prisma.professor.update({
      where: { id },
      data: { senhaHash },
    });
  }

  async anonymize(id: string): Promise<Professor> {
    return prisma.professor.update({
      where: { id },
      data: {
        nomeCompleto: 'Usuário Removido',
        email: `anon-${id}@removido.local`,
        senhaHash: 'ANONYMIZED_ACCOUNT_LOCKED',
      },
    });
  }
}
