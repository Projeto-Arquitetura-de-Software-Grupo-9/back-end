import { Professor } from '@prisma/client';

export interface CreateProfessorDTO {
  nomeCompleto: string;
  email: string;
  senhaHash: string;
}

export interface IProfessorRepository {
  findById(id: string): Promise<Professor | null>;
  findByEmail(email: string): Promise<Professor | null>;
  create(data: CreateProfessorDTO): Promise<Professor>;
}
