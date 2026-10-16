import { Questao, Alternativa } from '@prisma/client';

export interface AlternativaDTO {
  id?: string;
  letra: string;
  texto: string;
  correta: boolean;
}

export interface QuestaoWithAlternativas extends Questao {
  alternativas: Alternativa[];
  disciplina?: {
    id: string;
    nome: string;
    codigo: string;
  };
}

export interface CreateQuestaoDTO {
  idProfessor: string;
  idDisciplina: string;
  codigo: string;
  tipo: string;
  dificuldade: string;
  enunciado: string;
  pontuacao: number;
  alternativas: Array<{
    letra: string;
    texto: string;
    correta: boolean;
  }>;
}

export interface UpdateQuestaoDTO {
  idDisciplina?: string;
  codigo?: string;
  tipo?: string;
  dificuldade?: string;
  enunciado?: string;
  pontuacao?: number;
  alternativas?: Array<{
    id?: string;
    letra: string;
    texto: string;
    correta: boolean;
  }>;
}

export interface IQuestaoRepository {
  list(filter?: { idProfessor?: string; idDisciplina?: string; tipo?: string; dificuldade?: string }): Promise<QuestaoWithAlternativas[]>;
  findById(id: string): Promise<QuestaoWithAlternativas | null>;
  create(data: CreateQuestaoDTO): Promise<QuestaoWithAlternativas>;
  update(id: string, data: UpdateQuestaoDTO): Promise<QuestaoWithAlternativas>;
  delete(id: string): Promise<boolean>;
}
