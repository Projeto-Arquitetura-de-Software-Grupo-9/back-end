import { Correcao } from '@prisma/client';

export interface CreateCorrecaoDTO {
  idVersaoProva: string;
  idAluno?: string | null;
  nomeManuscrito?: string | null;
  matriculaManuscrita?: string | null;
  notaTotal: number;
  respostasLidas: Record<string, string>;
  atribuicaoAutomatica?: boolean;
}

export interface CorrecaoWithRelations extends Correcao {
  aluno?: {
    id: string;
    nome: string;
    matricula: string;
    curso: string;
  } | null;
  versaoProva?: {
    id: string;
    idProva: string;
    letraVersao: string;
    payloadQrCode: string;
  };
}

export interface ICorrecaoRepository {
  list(filter?: { idVersaoProva?: string; idAluno?: string }): Promise<CorrecaoWithRelations[]>;
  findById(id: string): Promise<CorrecaoWithRelations | null>;
  create(data: CreateCorrecaoDTO): Promise<Correcao>;
  assignStudent(id: string, idAluno: string): Promise<Correcao>;
  delete(id: string): Promise<boolean>;
}
