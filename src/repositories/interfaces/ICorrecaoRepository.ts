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
  student?: {
    id: string;
    name: string;
    registration: string;
    course: string;
  } | null;
  versaoProva?: {
    id: string;
    examId?: string;
    versionLetter?: string;
    qrCodePayload?: string;
  };
}

export interface ICorrecaoRepository {
  list(filter?: { idVersaoProva?: string; idAluno?: string }): Promise<CorrecaoWithRelations[]>;
  findById(id: string): Promise<CorrecaoWithRelations | null>;
  create(data: CreateCorrecaoDTO): Promise<Correcao>;
  assignStudent(id: string, idAluno: string): Promise<Correcao>;
  delete(id: string): Promise<boolean>;
}
