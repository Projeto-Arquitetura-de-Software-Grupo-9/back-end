import { Aluno } from '@prisma/client';

export interface CreateAlunoDTO {
  idTurma: string;
  nome: string;
  matricula: string;
  email: string;
  curso: string;
}

export interface UpdateAlunoDTO {
  idTurma?: string;
  nome?: string;
  matricula?: string;
  email?: string;
  curso?: string;
}

export interface IAlunoRepository {
  listByTurma(idTurma: string): Promise<Aluno[]>;
  listAll(): Promise<Aluno[]>;
  findById(id: string): Promise<Aluno | null>;
  findByMatricula(matricula: string): Promise<Aluno | null>;
  create(data: CreateAlunoDTO): Promise<Aluno>;
  createMany(data: CreateAlunoDTO[]): Promise<{ count: number }>;
  update(id: string, data: UpdateAlunoDTO): Promise<Aluno>;
  delete(id: string): Promise<boolean>;
}
