import { Prova, VersaoProva, ProvaQuestao } from '@prisma/client';

export interface CreateProvaDTO {
  idProfessor: string;
  idTurma: string;
  idDisciplina: string;
  codigo: string;
  titulo: string;
  dataAplicacao: Date;
  status?: string;
  embaralharQuestoes?: boolean;
  embaralharAlternativas?: boolean;
  numeroVersoes?: number;
  notaMaxima?: number;
  questoesIds?: string[];
}

export interface UpdateProvaDTO {
  idTurma?: string;
  idDisciplina?: string;
  codigo?: string;
  titulo?: string;
  dataAplicacao?: Date;
  status?: string;
  embaralharQuestoes?: boolean;
  embaralharAlternativas?: boolean;
  numeroVersoes?: number;
  notaMaxima?: number;
}

export interface ProvaWithRelations extends Prova {
  disciplina?: {
    id: string;
    nome: string;
    codigo: string;
  };
  turma?: {
    id: string;
    nome: string;
    periodoLetivo: string;
  };
  questoes?: Array<ProvaQuestao & { questao?: any }>;
  versoes?: VersaoProva[];
}

export interface IProvaRepository {
  list(filter?: { idProfessor?: string; idTurma?: string; idDisciplina?: string }): Promise<ProvaWithRelations[]>;
  findById(id: string): Promise<ProvaWithRelations | null>;
  create(data: CreateProvaDTO): Promise<ProvaWithRelations>;
  update(id: string, data: UpdateProvaDTO): Promise<ProvaWithRelations>;
  delete(id: string): Promise<boolean>;
}
