import { Turma } from '@prisma/client';

export interface CreateTurmaDTO {
  idProfessor: string;
  idDisciplina: string;
  nome: string;
  periodoLetivo: string;
  status?: string;
}

export interface UpdateTurmaDTO {
  idDisciplina?: string;
  nome?: string;
  periodoLetivo?: string;
  status?: string;
}

export interface TurmaWithRelations extends Turma {
  disciplina?: {
    id: string;
    nome: string;
    codigo: string;
    curso: string;
  };
  _count?: {
    students?: number;
  };
}

export interface ITurmaRepository {
  list(idProfessor?: string): Promise<TurmaWithRelations[]>;
  findById(id: string): Promise<TurmaWithRelations | null>;
  create(data: CreateTurmaDTO): Promise<Turma>;
  update(id: string, data: UpdateTurmaDTO): Promise<Turma>;
  delete(id: string): Promise<boolean>;
}
