import {
  AlternativeDTO,
  AlternativeLetter,
  CreateQuestionRequestDTO,
  QuestionDTO,
  QuestionFilterDTO,
  UpdateQuestionRequestDTO,
} from '../../types/question.dto';
import { IQuestionRepository } from '../interfaces/IQuestionRepository';

export class MockQuestionRepository implements IQuestionRepository {
  private questions: QuestionDTO[] = [
    {
      id: 'q-disc-1',
      teacherId: 'usr-prof-1',
      code: '#Q-DISC-01',
      type: 'discursiva',
      discipline: 'Direito Constitucional',
      difficulty: 'Difícil',
      topic: 'Controle de Constitucionalidade',
      tags: ['Discursiva', 'Direito Constitucional', 'Controle'],
      statement:
        'Explique a diferença entre a eficácia *erga omnes* e o efeito vinculante nas decisões proferidas pelo Supremo Tribunal Federal em sede de controle concentrado de constitucionalidade (art. 102, § 2º da CF/88).',
      alternatives: [],
      correctAlternative: 'A',
      gabaritoDisplay: 'ID-1',
      points: 2.5,
      maxScore: 2.5,
      explanation:
        'Critério de correção: Deve abordar a abrangência subjetiva em relação aos demais órgãos do Poder Judiciário e à Administração Pública, bem como a não vinculação do Poder Legislativo em sua função típica.',
      createdAt: '2026-02-01T08:00:00Z',
    },
    {
      id: 'q-1024',
      teacherId: 'usr-prof-1',
      code: '#Q-1024',
      type: 'objetiva',
      discipline: 'Direito Constitucional',
      difficulty: 'Médio',
      topic: 'Direitos Fundamentais',
      tags: ['TAG 1', 'TAG 2', 'TAG 3'],
      statement:
        'Acerca da disciplina constitucional dos direitos e garantias fundamentais previstos no art. 5º da CF/88, assinale a alternativa correta sobre o princípio da inviolabilidade do domicílio.',
      alternatives: [
        {
          id: 'a1',
          letter: 'A',
          text: 'O ingresso forçado em domicílio sem consentimento do titular é admitido a qualquer hora do dia ou da noite mediante ordem da autoridade policial.',
          isCorrect: false,
        },
        {
          id: 'a2',
          letter: 'B',
          text: 'A casa é asilo inviolável do indivíduo, ninguém nela podendo penetrar sem consentimento do morador, salvo em caso de flagrante delito ou desastre, ou para prestar socorro, ou, durante o dia, por determinação judicial.',
          isCorrect: true,
        },
        {
          id: 'a3',
          letter: 'C',
          text: 'O conceito constitucional de casa restringe-se à residência fixa da pessoa natural, excluindo-se quartos de hotel e escritórios profissionais.',
          isCorrect: false,
        },
        {
          id: 'a4',
          letter: 'D',
          text: 'A determinação judicial para busca e apreensão domiciliar pode ser cumprida no período noturno desde que haja intimação prévia do investigado.',
          isCorrect: false,
        },
        {
          id: 'a5',
          letter: 'E',
          text: 'O consentimento do morador para ingresso de agentes policiais dispensa qualquer registro ou comprovação de voluntariedade.',
          isCorrect: false,
        },
      ],
      correctAlternative: 'B',
      gabaritoDisplay: 'ID-2',
      points: 1.0,
      explanation:
        'Gabarito correto: ID-2 (Alternativa B). Conforme o art. 5º, XI, da CF/88, a casa é asilo inviolável do indivíduo, com as exceções expressamente taxadas.',
      createdAt: '2026-02-01T08:05:00Z',
    },
    {
      id: 'q-1024-2',
      teacherId: 'usr-prof-1',
      code: '#Q-1024',
      type: 'objetiva',
      discipline: 'Direito Penal',
      difficulty: 'Médio',
      topic: 'Teoria do Delito e Culpabilidade',
      tags: ['TAG 1', 'TAG 2', 'TAG 3'],
      statement:
        'Em matéria de causas excludentes da culpabilidade e da ilicitude no Código Penal brasileiro, assinale a assertiva correta no que tange à coação moral irresistível e à legítima defesa.',
      alternatives: [
        {
          id: 'a1_2',
          letter: 'A',
          text: 'A coação moral irresistível exclui a tipicidade penal do fato praticado, isentando tanto o coator quanto o coagido.',
          isCorrect: false,
        },
        {
          id: 'a2_2',
          letter: 'B',
          text: 'A coação moral irresistível exclui a culpabilidade em razão da inexigibilidade de conduta diversa, respondendo pelas penas somente o autor da coação.',
          isCorrect: true,
        },
        {
          id: 'a3_2',
          letter: 'C',
          text: 'A legítima defesa putativa constitui causa obrigatória de extinção imediata da punibilidade sem análise do erro.',
          isCorrect: false,
        },
        {
          id: 'a4_2',
          letter: 'D',
          text: 'O excesso doloso na legítima defesa isenta o agente de qualquer responsabilidade penal pelo resultado excedente.',
          isCorrect: false,
        },
        {
          id: 'a5_2',
          letter: 'E',
          text: 'O estado de necessidade recíproco é expressamente vedado pelo ordenamento jurídico-penal brasileiro.',
          isCorrect: false,
        },
      ],
      correctAlternative: 'B',
      gabaritoDisplay: 'ID-2',
      points: 1.0,
      explanation:
        'Gabarito correto: ID-2 (Alternativa B). Art. 22 do Código Penal: sob coação irresistível, só é punível o autor da coação.',
      createdAt: '2026-02-01T08:10:00Z',
    },
    {
      id: 'q-1024-3',
      teacherId: 'usr-prof-1',
      code: '#Q-1024',
      type: 'objetiva',
      discipline: 'Direito Civil',
      difficulty: 'Médio',
      topic: 'Responsabilidade Civil e Risco',
      tags: ['TAG 1', 'TAG 2', 'TAG 3'],
      statement:
        'No âmbito do Direito Civil brasileiro, relativamente ao regime da responsabilidade civil objetiva e subjetiva disciplinada pelo Código Civil de 2002, assinale a afirmativa correta.',
      alternatives: [
        {
          id: 'a1_3',
          letter: 'A',
          text: 'A responsabilidade civil subjetiva dispensa a comprovação de culpa lato sensu, bastando a demonstração do dano e do nexo de causalidade.',
          isCorrect: false,
        },
        {
          id: 'a2_3',
          letter: 'B',
          text: 'Haverá obrigação de reparar o dano, independentemente de culpa, nos casos especificados em lei, ou quando a atividade normalmente desenvolvida pelo autor do dano implicar, por sua natureza, risco para os direitos de outrem.',
          isCorrect: true,
        },
        {
          id: 'a3_3',
          letter: 'C',
          text: 'O dano moral indenizável exige sempre demonstração cumulativa de reflexo patrimonial direto na esfera da vítima.',
          isCorrect: false,
        },
        {
          id: 'a4_3',
          letter: 'D',
          text: 'A culpa exclusiva da vítima jamais rompe o nexo de causalidade nas hipóteses legais de responsabilidade pelo risco.',
          isCorrect: false,
        },
        {
          id: 'a5_3',
          letter: 'E',
          text: 'A incapacidade civil relativa do agente exclui sumariamente o dever de indenizar mesmo havendo bens e patrimônio próprio.',
          isCorrect: false,
        },
      ],
      correctAlternative: 'B',
      gabaritoDisplay: 'ID-2',
      points: 1.0,
      explanation:
        'Gabarito correto: ID-2 (Alternativa B). Art. 927, parágrafo único, do CC/02 consagra a responsabilidade civil objetiva com esteio na teoria do risco.',
      createdAt: '2026-02-01T08:15:00Z',
    },
    {
      id: 'q-1025',
      teacherId: 'usr-prof-1',
      code: '#Q-1025',
      type: 'objetiva',
      discipline: 'Direito Penal',
      difficulty: 'Fácil',
      topic: 'Teoria Geral do Delito',
      tags: ['TAG 1', 'Direito Penal', 'TAG 2'],
      statement:
        'No âmbito do Direito Penal brasileiro e segundo a teoria tripartite do crime (majoritariamente adotada pela doutrina e jurisprudência), o conceito analítico de crime é composto por:',
      alternatives: [
        {
          id: 'b1',
          letter: 'A',
          text: 'Fato típico, ilícito (ou antijurídico) e culpável.',
          isCorrect: true,
        },
        {
          id: 'b2',
          letter: 'B',
          text: 'Fato típico, antijurídico e punível.',
          isCorrect: false,
        },
        {
          id: 'b3',
          letter: 'C',
          text: 'Conduta voluntária, dolo direto e periculosidade.',
          isCorrect: false,
        },
        {
          id: 'b4',
          letter: 'D',
          text: 'Ação culposa, nexo de causalidade e imputabilidade estrita.',
          isCorrect: false,
        },
        {
          id: 'b5',
          letter: 'E',
          text: 'Tipicidade formal, exigibilidade de conduta e punibilidade.',
          isCorrect: false,
        },
      ],
      correctAlternative: 'A',
      gabaritoDisplay: 'ID-1',
      points: 1.0,
      explanation:
        'O conceito analítico tripartite define crime como fato típico, antijurídico (ilícito) e culpável.',
      createdAt: '2026-02-01T08:20:00Z',
    },
    {
      id: 'q-1026',
      teacherId: 'usr-prof-1',
      code: '#Q-1026',
      type: 'objetiva',
      discipline: 'Direito Administrativo',
      difficulty: 'Difícil',
      topic: 'Poderes e Atos Administrativos',
      tags: ['TAG 2', 'Direito Administrativo', 'TAG 3'],
      statement:
        'A respeito dos atributos do ato administrativo e do controle da Administração Pública, analise o princípio da autotutela consagrado nas Súmulas 346 e 473 do Supremo Tribunal Federal (STF).',
      alternatives: [
        {
          id: 'c1',
          letter: 'A',
          text: 'A Administração pode anular seus próprios atos apenas quando provocada pelo Poder Judiciário, respeitado o contraditório.',
          isCorrect: false,
        },
        {
          id: 'c2',
          letter: 'B',
          text: 'A revogação de atos administrativos alcança atos eivados de vício de ilegalidade insanável, operando efeitos retroativos ex tunc.',
          isCorrect: false,
        },
        {
          id: 'c3',
          letter: 'C',
          text: 'O controle judicial dos atos administrativos restringe-se exclusivamente ao mérito de conveniência e oportunidade do administrador.',
          isCorrect: false,
        },
        {
          id: 'c4',
          letter: 'D',
          text: 'A anulação de ato administrativo de que decorram efeitos favoráveis para os destinatários prescreve em dez anos, salvo má-fé.',
          isCorrect: false,
        },
        {
          id: 'c5',
          letter: 'E',
          text: 'A Administração pode anular seus próprios atos, quando eivados de vícios que os tornam ilegais, porque deles não se originam direitos; ou revogá-los, por motivo de conveniência ou oportunidade.',
          isCorrect: true,
        },
      ],
      correctAlternative: 'E',
      gabaritoDisplay: 'ID-5',
      points: 1.0,
      explanation:
        'Súmula 473 do STF: autotutela permite anulação de atos ilegais (efeito ex tunc) e revogação por conveniência e oportunidade (efeito ex nunc).',
      createdAt: '2026-02-01T08:25:00Z',
    },
    {
      id: 'q-1027',
      teacherId: 'usr-prof-1',
      code: '#Q-1027',
      type: 'objetiva',
      discipline: 'Direito Civil',
      difficulty: 'Fácil',
      topic: 'Negócio Jurídico e Validade',
      tags: ['TAG 1', 'Direito Civil', 'TAG 3'],
      statement:
        'Nos termos expressos do art. 104 do Código Civil brasileiro, a validade do negócio jurídico requer agente capaz, objeto lícito, possível, determinado ou determinável, e:',
      alternatives: [
        { id: 'd1', letter: 'A', text: 'Forma prescrita ou não defesa em lei.', isCorrect: true },
        { id: 'd2', letter: 'B', text: 'Registro público imobiliário perante o cartório competente.', isCorrect: false },
        { id: 'd3', letter: 'C', text: 'Reconhecimento de firma por autenticidade das partes.', isCorrect: false },
        { id: 'd4', letter: 'D', text: 'Assistência obrigatória de advogado devidamente inscrito na OAB.', isCorrect: false },
        { id: 'd5', letter: 'E', text: 'Homologação judicial prévia da vontade manifestada.', isCorrect: false },
      ],
      correctAlternative: 'A',
      gabaritoDisplay: 'ID-1',
      points: 1.0,
      explanation:
        'Art. 104 do Código Civil: agente capaz, objeto lícito, possível, determinado ou determinável, e forma prescrita ou não defesa em lei.',
      createdAt: '2026-02-01T08:30:00Z',
    },
    {
      id: 'q-1028',
      teacherId: 'usr-prof-1',
      code: '#Q-1028',
      type: 'objetiva',
      discipline: 'Direito Constitucional',
      difficulty: 'Médio',
      topic: 'Controle de Constitucionalidade',
      tags: ['TAG 1', 'TAG 2', 'Direito Constitucional'],
      statement:
        'Sobre os legitimados para propositura da Ação Direta de Inconstitucionalidade (ADI) perante o Supremo Tribunal Federal, conforme o art. 103 da Constituição Federal, assinale a afirmativa correta:',
      alternatives: [
        {
          id: 'e1',
          letter: 'A',
          text: 'O Conselho Federal da Ordem dos Advogados do Brasil é legitimado universal, não necessitando comprovar pertinência temática.',
          isCorrect: true,
        },
        {
          id: 'e2',
          letter: 'B',
          text: 'As confederações sindicais são legitimadas universais, podendo questionar qualquer matéria independentemente da categoria.',
          isCorrect: false,
        },
        {
          id: 'e3',
          letter: 'C',
          text: 'O Governador de Estado possui legitimação universal irrestrita em sede de fiscalização abstrata perante o STF.',
          isCorrect: false,
        },
        {
          id: 'e4',
          letter: 'D',
          text: 'Partidos políticos com representação em qualquer Câmara Municipal possuem legitimidade ativa para propor ADI no STF.',
          isCorrect: false,
        },
        {
          id: 'e5',
          letter: 'E',
          text: 'Qualquer cidadão eleitor no pleno exercício dos direitos políticos pode ajuizar ADI perante o Supremo Tribunal Federal.',
          isCorrect: false,
        },
      ],
      correctAlternative: 'A',
      gabaritoDisplay: 'ID-1',
      points: 1.0,
      explanation:
        'O CFOAB (art. 103, VII, CF/88) é classificado pela jurisprudência do STF como legitimado universal ou neutro, sem exigência de pertinência temática.',
      createdAt: '2026-02-01T08:35:00Z',
    },
    {
      id: 'q-1029',
      teacherId: 'usr-prof-1',
      code: '#Q-1029',
      type: 'objetiva',
      discipline: 'Direito Processual Civil',
      difficulty: 'Fácil',
      topic: 'Tutela Provisória',
      tags: ['TAG 3', 'Processo Civil'],
      statement:
        'Segundo o Código de Processo Civil brasileiro (CPC/2015), a tutela provisória pode fundamentar-se em:',
      alternatives: [
        { id: 'f1', letter: 'A', text: 'Preclusão consumativa ou coisa julgada formal.', isCorrect: false },
        { id: 'f2', letter: 'B', text: 'Urgência ou evidência.', isCorrect: true },
        { id: 'f3', letter: 'C', text: 'Revelia ou julgamento antecipado do mérito.', isCorrect: false },
        { id: 'f4', letter: 'D', text: 'Suspeição ou impedimento do magistrado prolator.', isCorrect: false },
        { id: 'f5', letter: 'E', text: 'Incompetência absoluta ou derrogação de foro.', isCorrect: false },
      ],
      correctAlternative: 'B',
      gabaritoDisplay: 'ID-2',
      points: 1.0,
      explanation: 'Art. 294 do CPC: a tutela provisória pode fundamentar-se em urgência ou evidência.',
      createdAt: '2026-02-01T08:40:00Z',
    },
  ];

  private getGabaritoDisplay(letter: AlternativeLetter): string {
    const map: Record<AlternativeLetter, string> = {
      A: 'ID-1',
      B: 'ID-2',
      C: 'ID-3',
      D: 'ID-4',
      E: 'ID-5',
    };
    return map[letter] || `ID-${letter}`;
  }

  async findAll(filters?: QuestionFilterDTO): Promise<QuestionDTO[]> {
    let result = this.questions.filter((q) => !q.deletedAt);

    if (filters?.difficulty && filters.difficulty !== 'Todas') {
      result = result.filter(
        (q) => q.difficulty.toLowerCase() === filters.difficulty!.toLowerCase()
      );
    }

    if (filters?.tag && filters.tag !== 'Todas') {
      const tagLower = filters.tag.toLowerCase();
      result = result.filter(
        (q) => q.tags && q.tags.some((t) => t.toLowerCase() === tagLower)
      );
    }

    if (filters?.discipline && filters.discipline !== 'Todas') {
      const discLower = filters.discipline.toLowerCase();
      result = result.filter((q) => q.discipline.toLowerCase() === discLower);
    }

    if (filters?.type && filters.type !== 'Todas') {
      result = result.filter((q) => q.type === filters.type);
    }

    if (filters?.search && filters.search.trim() !== '') {
      const query = filters.search.trim().toLowerCase();
      result = result.filter(
        (q) =>
          q.statement.toLowerCase().includes(query) ||
          q.code.toLowerCase().includes(query) ||
          (q.topic && q.topic.toLowerCase().includes(query)) ||
          q.discipline.toLowerCase().includes(query) ||
          (q.tags && q.tags.some((t) => t.toLowerCase().includes(query)))
      );
    }

    return result.map((q) => ({ ...q }));
  }

  async findById(id: string): Promise<QuestionDTO | null> {
    const found = this.questions.find((q) => q.id === id && !q.deletedAt);
    return found ? { ...found } : null;
  }

  async create(data: CreateQuestionRequestDTO): Promise<QuestionDTO> {
    const id = `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const randomNum = Math.floor(1036 + Math.random() * 900);
    const code = data.code?.trim() || `#Q-${randomNum}`;
    const type = data.type || 'objetiva';
    const correctAlternative: AlternativeLetter = data.correctAlternative || 'A';

    const alternatives: AlternativeDTO[] =
      type === 'discursiva'
        ? []
        : (data.alternatives || []).map((alt, idx) => ({
            id: alt.id || `alt-${Date.now()}-${idx}`,
            letter: alt.letter,
            text: alt.text.trim(),
            isCorrect: alt.letter === correctAlternative,
          }));

    const newQuestion: QuestionDTO = {
      id,
      teacherId: data.teacherId || 'usr-prof-1',
      code,
      type,
      discipline: data.discipline.trim(),
      difficulty: data.difficulty,
      topic: data.topic?.trim() || 'Geral',
      tags:
        data.tags && data.tags.length > 0
          ? data.tags
          : [data.discipline.trim(), data.difficulty],
      statement: data.statement.trim(),
      alternatives,
      correctAlternative,
      gabaritoDisplay: this.getGabaritoDisplay(correctAlternative),
      points: data.points !== undefined ? Number(data.points) : 1.0,
      maxScore: data.maxScore !== undefined ? Number(data.maxScore) : data.points || 1.0,
      explanation: data.explanation?.trim(),
      createdAt: new Date().toISOString(),
    };

    this.questions.unshift(newQuestion);
    return { ...newQuestion };
  }

  async update(
    id: string,
    data: UpdateQuestionRequestDTO
  ): Promise<QuestionDTO | null> {
    const index = this.questions.findIndex((q) => q.id === id && !q.deletedAt);
    if (index === -1) return null;

    const existing = this.questions[index];
    const type = data.type !== undefined ? data.type : existing.type;
    const correctAlternative =
      data.correctAlternative !== undefined
        ? data.correctAlternative
        : existing.correctAlternative;

    const alternatives: AlternativeDTO[] =
      type === 'discursiva'
        ? []
        : data.alternatives !== undefined
        ? data.alternatives.map((alt, idx) => ({
            id: alt.id || `alt-${Date.now()}-${idx}`,
            letter: alt.letter,
            text: alt.text.trim(),
            isCorrect: alt.letter === correctAlternative,
          }))
        : existing.alternatives.map((alt) => ({
            ...alt,
            isCorrect: alt.letter === correctAlternative,
          }));

    const updated: QuestionDTO = {
      ...existing,
      code: data.code !== undefined ? data.code.trim() : existing.code,
      type,
      discipline:
        data.discipline !== undefined
          ? data.discipline.trim()
          : existing.discipline,
      difficulty:
        data.difficulty !== undefined ? data.difficulty : existing.difficulty,
      topic: data.topic !== undefined ? data.topic.trim() : existing.topic,
      tags: data.tags !== undefined ? data.tags : existing.tags,
      statement:
        data.statement !== undefined ? data.statement.trim() : existing.statement,
      alternatives,
      correctAlternative,
      gabaritoDisplay: this.getGabaritoDisplay(correctAlternative),
      points: data.points !== undefined ? Number(data.points) : existing.points,
      maxScore:
        data.maxScore !== undefined ? Number(data.maxScore) : existing.maxScore,
      explanation:
        data.explanation !== undefined
          ? data.explanation.trim()
          : existing.explanation,
    };

    this.questions[index] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    const initialLength = this.questions.length;
    this.questions = this.questions.filter((q) => q.id !== id);
    return this.questions.length < initialLength;
  }

  async getAvailableTags(): Promise<string[]> {
    const set = new Set<string>();
    this.questions.forEach((q) => {
      if (!q.deletedAt && q.tags && q.tags.length > 0) {
        q.tags.forEach((t) => set.add(t));
      }
    });
    if (set.size === 0) {
      set.add('TAG 1');
      set.add('TAG 2');
      set.add('TAG 3');
    }
    return ['Todas', ...Array.from(set)];
  }

  async getAvailableDisciplines(): Promise<string[]> {
    const set = new Set<string>(
      this.questions.filter((q) => !q.deletedAt).map((q) => q.discipline)
    );
    return ['Todas', ...Array.from(set)];
  }
}
