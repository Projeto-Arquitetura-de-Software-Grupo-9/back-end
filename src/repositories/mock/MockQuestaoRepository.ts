import { Decimal } from '@prisma/client/runtime/library';
import { CreateQuestaoDTO, IQuestaoRepository, QuestaoWithAlternativas, UpdateQuestaoDTO } from '../interfaces/IQuestaoRepository';

export class MockQuestaoRepository implements IQuestaoRepository {
  private questoes: QuestaoWithAlternativas[] = [
    {
      id: 'q-101',
      idProfessor: 'prof-catolica-01',
      idDisciplina: 'disc-1',
      codigo: '#DIR-01',
      tipo: 'objetiva',
      dificuldade: 'Médio',
      enunciado: 'Nos termos da Constituição Federal de 1988, a República Federativa do Brasil rege-se nas suas relações internacionais pelos seguintes princípios, EXCETO:',
      pontuacao: new Decimal(1.0),
      alternativas: [
        { id: 'alt-1', idQuestao: 'q-101', letra: 'A', texto: 'Independência nacional e prevalência dos direitos humanos.', correta: false },
        { id: 'alt-2', idQuestao: 'q-101', letra: 'B', texto: 'Autodeterminação dos povos e não-intervenção.', correta: false },
        { id: 'alt-3', idQuestao: 'q-101', letra: 'C', texto: 'Intervenção militar humanitária unilateral preventiva.', correta: true },
        { id: 'alt-4', idQuestao: 'q-101', letra: 'D', texto: 'Igualdade entre os Estados e defesa da paz.', correta: false },
        { id: 'alt-5', idQuestao: 'q-101', letra: 'E', texto: 'Solução pacífica dos conflitos e repúdio ao terrorismo.', correta: false },
      ],
      disciplina: {
        id: 'disc-1',
        nome: 'Direito Constitucional I',
        codigo: 'DIR-101',
      },
    },
    {
      id: 'q-102',
      idProfessor: 'prof-catolica-01',
      idDisciplina: 'disc-1',
      codigo: '#DIR-02',
      tipo: 'objetiva',
      dificuldade: 'Fácil',
      enunciado: 'Sobre o controle de constitucionalidade concentrado no Supremo Tribunal Federal, assinale a opção CORRETA:',
      pontuacao: new Decimal(1.0),
      alternativas: [
        { id: 'alt-6', idQuestao: 'q-102', letra: 'A', texto: 'A Ação Direta de Inconstitucionalidade (ADI) pode ser proposta por qualquer cidadão eleitor.', correta: false },
        { id: 'alt-7', idQuestao: 'q-102', letra: 'B', texto: 'O Procurador-Geral da República é parte legítima para propor a Ação Declaratória de Constitucionalidade (ADC).', correta: true },
        { id: 'alt-8', idQuestao: 'q-102', letra: 'C', texto: 'A decisão definitiva de mérito em ADI possui apenas efeito inter partes.', correta: false },
        { id: 'alt-9', idQuestao: 'q-102', letra: 'D', texto: 'A Arguição de Descumprimento de Preceito Fundamental (ADPF) cabe mesmo quando houver outro meio eficaz de sanar a lesividade.', correta: false },
      ],
      disciplina: {
        id: 'disc-1',
        nome: 'Direito Constitucional I',
        codigo: 'DIR-101',
      },
    },
    {
      id: 'q-103',
      idProfessor: 'prof-catolica-01',
      idDisciplina: 'disc-2',
      codigo: '#MAT-01',
      tipo: 'objetiva',
      dificuldade: 'Difícil',
      enunciado: 'Considere a função f(x) = x^3 - 3x + 2. Os pontos críticos de f ocorrem exatamente em:',
      pontuacao: new Decimal(2.0),
      alternativas: [
        { id: 'alt-10', idQuestao: 'q-103', letra: 'A', texto: 'x = 1 e x = -1', correta: true },
        { id: 'alt-11', idQuestao: 'q-103', letra: 'B', texto: 'x = 0 e x = 2', correta: false },
        { id: 'alt-12', idQuestao: 'q-103', letra: 'C', texto: 'x = 3 e x = -3', correta: false },
        { id: 'alt-13', idQuestao: 'q-103', letra: 'D', texto: 'x = 2 e x = -2', correta: false },
      ],
      disciplina: {
        id: 'disc-2',
        nome: 'Cálculo Diferencial e Integral I',
        codigo: 'MAT-201',
      },
    },
  ];

  async list(filter?: { idProfessor?: string; idDisciplina?: string; tipo?: string; dificuldade?: string }): Promise<QuestaoWithAlternativas[]> {
    return this.questoes.filter((q) => {
      if (filter?.idProfessor && q.idProfessor !== filter.idProfessor) return false;
      if (filter?.idDisciplina && q.idDisciplina !== filter.idDisciplina) return false;
      if (filter?.tipo && q.tipo !== filter.tipo) return false;
      if (filter?.dificuldade && q.dificuldade !== filter.dificuldade) return false;
      return true;
    });
  }

  async findById(id: string): Promise<QuestaoWithAlternativas | null> {
    return this.questoes.find((q) => q.id === id) || null;
  }

  async create(data: CreateQuestaoDTO): Promise<QuestaoWithAlternativas> {
    const qId = `q-${Date.now()}`;
    const newQ: QuestaoWithAlternativas = {
      id: qId,
      idProfessor: data.idProfessor,
      idDisciplina: data.idDisciplina,
      codigo: data.codigo,
      tipo: data.tipo,
      dificuldade: data.dificuldade,
      enunciado: data.enunciado,
      pontuacao: new Decimal(data.pontuacao),
      alternativas: data.alternativas.map((alt, idx) => ({
        id: `alt-${Date.now()}-${idx}`,
        idQuestao: qId,
        letra: alt.letra,
        texto: alt.texto,
        correta: alt.correta,
      })),
    };
    this.questoes.push(newQ);
    return newQ;
  }

  async update(id: string, data: UpdateQuestaoDTO): Promise<QuestaoWithAlternativas> {
    const idx = this.questoes.findIndex((q) => q.id === id);
    if (idx === -1) {
      throw new Error(`Questão com ID ${id} não encontrada.`);
    }
    const current = this.questoes[idx];
    const updated: QuestaoWithAlternativas = {
      ...current,
      idDisciplina: data.idDisciplina || current.idDisciplina,
      codigo: data.codigo || current.codigo,
      tipo: data.tipo || current.tipo,
      dificuldade: data.dificuldade || current.dificuldade,
      enunciado: data.enunciado || current.enunciado,
      pontuacao: data.pontuacao !== undefined ? new Decimal(data.pontuacao) : current.pontuacao,
      alternativas: data.alternativas
        ? data.alternativas.map((alt, i) => ({
            id: alt.id || `alt-${Date.now()}-${i}`,
            idQuestao: id,
            letra: alt.letra,
            texto: alt.texto,
            correta: alt.correta,
          }))
        : current.alternativas,
    };
    this.questoes[idx] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const prev = this.questoes.length;
    this.questoes = this.questoes.filter((q) => q.id !== id);
    return this.questoes.length < prev;
  }
}
