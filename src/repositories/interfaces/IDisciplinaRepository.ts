import { Disciplina } from '@prisma/client';

export interface CreateDisciplinaDTO {
  idProfessor: string;
  codigo: string;
  nome: string;
  curso: string;
}

export interface UpdateDisciplinaDTO {
  codigo?: string;
  nome?: string;
  curso?: string;
}

export interface IDisciplinaRepository {
  list(idProfessor?: string): Promise<Disciplina[]>;
  findById(id: string): Promise<Disciplina | null>;
  create(data: CreateDisciplinaDTO): Promise<Disciplina>;
  update(id: string, data: UpdateDisciplinaDTO): Promise<Disciplina>;
  delete(id: string): Promise<boolean>;
}
