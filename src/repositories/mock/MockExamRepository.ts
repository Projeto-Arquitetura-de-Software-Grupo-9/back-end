import {
  ExamHeaderDTO,
  ExamLayoutDTO,
  ExamPageDTO,
  ExamQuestionLayoutDTO,
  ExamVersionLetter,
} from '../../types/examPdf.dto';
import {
  CreateExamDTO,
  ExamRecordDTO,
  IExamRepository,
  UpdateExamDTO,
} from '../interfaces/IExamRepository';

export class MockExamRepository implements IExamRepository {
  private sampleHeaders: Record<string, ExamHeaderDTO> = {
    'exam-catolica-01': {
      institution: 'Católica SC Centro Universitário',
      department: 'Escola de Direito',
      course: 'Direito',
      discipline: 'Sociedades Empresariais e Direito de Reestruturação Empresarial',
      classGroup: 'Turma A',
      semester: '2024.2',
      title: 'AVALIAÇÃO ESCRITA 02',
      subtitle: 'Semestre Letivo 2024.2',
      code: '#DIR-EMPRESARIAL-02',
      date: '23/10/2024',
      duration: '3 horas',
      instructions: [
        'Sobre a mesa, o estudante deverá manter somente o material necessário para a realização da prova (caneta azul ou preta, lápis e borracha).',
        'Todos os celulares e aparelhos eletrônicos deverão ser desligados e guardados.',
        'A interpretação das questões faz parte integrante da avaliação.',
        'As questões objetivas devem ser assinaladas no gabarito oficial com preenchimento completo do círculo.',
        'Rasuras na folha de respostas anularão a questão.',
      ],
      includeBoxNota: false,
    },
    'exam-default': {
      institution: 'UNIVERSIDADE FEDERAL DO RIO DE JANEIRO',
      department: 'Faculdade Nacional de Direito | Departamento de Direito Público',
      course: 'Direito',
      discipline: 'Direito Constitucional',
      classGroup: 'Turma A',
      semester: '2024.2',
      title: 'P1 - Direito Constitucional I - 2024.2',
      subtitle: 'Primeiro Semestre Acadêmico 2024.2',
      code: '#DIR-CONST-2024.2',
      date: '12/03/2024',
      duration: '2 horas',
      instructions: [
        'Marque apenas uma alternativa por questão.',
        'Preencha completamente o campo correspondente com caneta preta ou azul.',
        'Rasuras anularão a questão.',
        'Duração máxima: 2 horas. Permitida consulta apenas a textos de lei seca sem anotações.',
      ],
      includeBoxNota: false,
    },
  };

  private mockExams: ExamRecordDTO[] = [
    {
      id: 'exam-catolica-01',
      code: '#DIR-EMPRESARIAL-02',
      title: 'AVALIAÇÃO ESCRITA 02',
      subtitle: 'Semestre Letivo 2024.2',
      institution: 'Católica SC Centro Universitário',
      department: 'Escola de Direito',
      course: 'Direito',
      discipline: 'Sociedades Empresariais e Direito de Reestruturação Empresarial',
      disciplinaId: 'disc-mock-1',
      classGroup: 'Turma A',
      semester: '2024.2',
      date: '23/10/2024',
      duration: '3 horas',
      instructions: [
        'Sobre a mesa, o estudante deverá manter somente o material necessário para a realização da prova (caneta azul ou preta, lápis e borracha).',
        'Todos os celulares e aparelhos eletrônicos deverão ser desligados e guardados.',
        'A interpretação das questões faz parte integrante da avaliação.',
        'As questões objetivas devem ser assinaladas no gabarito oficial com preenchimento completo do círculo.',
        'Rasuras na folha de respostas anularão a questão.',
      ],
      includeBoxNota: false,
      variationsJson: { numberOfVersions: 4, shuffleQuestions: true, shuffleAlternatives: true },
      createdAt: new Date('2024-10-23T10:00:00Z'),
      versions: [],
    },
    {
      id: 'exam-default',
      code: '#DIR-CONST-2024.2',
      title: 'P1 - Direito Constitucional I - 2024.2',
      subtitle: 'Primeiro Semestre Acadêmico 2024.2',
      institution: 'UNIVERSIDADE FEDERAL DO RIO DE JANEIRO',
      department: 'Faculdade Nacional de Direito | Departamento de Direito Público',
      course: 'Direito',
      discipline: 'Direito Constitucional',
      disciplinaId: 'disc-mock-2',
      classGroup: 'Turma A',
      semester: '2024.2',
      date: '12/03/2024',
      duration: '2 horas',
      instructions: [
        'Marque apenas uma alternativa por questão.',
        'Preencha completamente o campo correspondente com caneta preta ou azul.',
        'Rasuras anularão a questão.',
        'Duração máxima: 2 horas. Permitida consulta apenas a textos de lei seca sem anotações.',
      ],
      includeBoxNota: false,
      variationsJson: { numberOfVersions: 4, shuffleQuestions: true, shuffleAlternatives: true },
      createdAt: new Date('2024-03-12T10:00:00Z'),
      versions: [],
    },
  ];

  private sampleQuestions: ExamQuestionLayoutDTO[] = [
    {
      id: 'q-101',
      originalQuestionId: 'q-1024',
      orderIndex: 1,
      statement:
        'A Constituição Federal de 1988 estabelece como princípio fundamental da República Federativa do Brasil:',
      discipline: 'Direito Constitucional',
      alternatives: [
        { id: 'a1', letter: 'A', text: 'O pluripartidarismo e a soberania nacional.' },
        { id: 'a2', letter: 'B', text: 'A soberania monetária irrestrita.' },
        { id: 'a3', letter: 'C', text: 'A centralização do poder judiciário nos Estados-membros.' },
        { id: 'a4', letter: 'D', text: 'A dissolução compulsória do Senado Federal em tempos de crise.' },
        { id: 'a5', letter: 'E', text: 'A vedação taxativa a tratados internacionais de direitos humanos.' },
      ],
      correctAlternative: 'A',
      pointValue: 2.0,
    },
    {
      id: 'q-102',
      originalQuestionId: 'q-1025',
      orderIndex: 2,
      statement:
        'Nos termos da legislação empresarial societária vigente e da Lei 11.101/2005 (Recuperação Judicial e Falência), a sociedade limitada responde por suas obrigações:',
      discipline: 'Direito Empresarial',
      alternatives: [
        { id: 'b1', letter: 'A', text: 'Solidariamente até o limite total do capital autorizado.' },
        { id: 'b2', letter: 'B', text: 'Limitada ao total do capital social integralizado pelos sócios quotistas.' },
        { id: 'b3', letter: 'C', text: 'Subsidariamente sem benefício de ordem patrimonial.' },
        { id: 'b4', letter: 'D', text: 'Com o patrimônio pessoal dos sócios em qualquer hipótese civil.' },
        { id: 'b5', letter: 'E', text: 'Apenas mediante caução fiduciária depositada em juízo.' },
      ],
      correctAlternative: 'B',
      pointValue: 2.0,
    },
    {
      id: 'q-103',
      originalQuestionId: 'q-1026',
      orderIndex: 3,
      statement:
        'Em relação aos direitos e garantias fundamentais individuais (artigo 5º da CF/88), a inviolabilidade domiciliar:',
      discipline: 'Direito Constitucional',
      alternatives: [
        { id: 'c1', letter: 'A', text: 'É absoluta e não comporta exceções em nenhuma hipótese legal.' },
        { id: 'c2', letter: 'B', text: 'Permite ingresso noturno com ordem judicial fundamentada.' },
        { id: 'c3', letter: 'C', text: 'Admite entrada a qualquer hora em caso de flagrante delito ou desastre.' },
        { id: 'c4', letter: 'D', text: 'Pode ser mitigada por simples deliberação da autoridade policial.' },
        { id: 'c5', letter: 'E', text: 'Depende de autorização do síndico em condomínios edilícios.' },
      ],
      correctAlternative: 'C',
      pointValue: 2.0,
    },
    {
      id: 'q-104',
      originalQuestionId: 'q-1027',
      orderIndex: 4,
      statement:
        'Na recuperação extrajudicial de empresas, o plano aprovado pelos credores que representem mais da metade dos créditos de cada classe:',
      discipline: 'Direito Empresarial',
      alternatives: [
        { id: 'd1', letter: 'A', text: 'Obriga todos os credores a ele sujeitos após homologação judicial.' },
        { id: 'd2', letter: 'B', text: 'Necessita de concordância unânime de 100% dos credores quirografários.' },
        { id: 'd3', letter: 'C', text: 'Não tem eficácia perante os credores que expressamente rejeitaram o plano.' },
        { id: 'd4', letter: 'D', text: 'Suspende de imediato apenas execuções fiscais da União.' },
        { id: 'd5', letter: 'E', text: 'Extingue automaticamente as garantias reais prestadas por terceiros.' },
      ],
      correctAlternative: 'A',
      pointValue: 2.0,
    },
    {
      id: 'q-105',
      originalQuestionId: 'q-1028',
      orderIndex: 5,
      statement:
        'O controle concentrado de constitucionalidade perante o Supremo Tribunal Federal pode ser instaurado por meio de:',
      discipline: 'Direito Constitucional',
      alternatives: [
        { id: 'e1', letter: 'A', text: 'Qualquer cidadão em gozo dos seus direitos políticos.' },
        { id: 'e2', letter: 'B', text: 'Ação Direta de Inconstitucionalidade proposta pelos legitimados do art. 103 da CF.' },
        { id: 'e3', letter: 'C', text: 'Recurso ordinário interposto pelo autor de ação popular.' },
        { id: 'e4', letter: 'D', text: 'Consulta prévia formulada por juiz de primeira instância.' },
        { id: 'e5', letter: 'E', text: 'Reclamação de associação de bairro sem representatividade nacional.' },
      ],
      correctAlternative: 'B',
      pointValue: 2.0,
    },
  ];

  async listExams(disciplinaId?: string): Promise<ExamRecordDTO[]> {
    if (disciplinaId) {
      return this.mockExams.filter((e) => e.disciplinaId === disciplinaId);
    }
    return [...this.mockExams];
  }

  async findExamById(id: string): Promise<ExamRecordDTO | null> {
    const exam = this.mockExams.find((e) => e.id === id);
    return exam ? { ...exam } : null;
  }

  async createExam(data: CreateExamDTO): Promise<ExamRecordDTO> {
    const newExam: ExamRecordDTO = {
      id: data.id || `exam-${Date.now()}`,
      code: data.code || `#PROVA-${Date.now().toString().slice(-4)}`,
      title: data.title,
      subtitle: data.subtitle || '',
      institution: data.institution,
      department: data.department,
      course: data.course,
      discipline: data.discipline,
      disciplinaId: data.disciplinaId || null,
      classGroup: data.classGroup,
      semester: data.semester,
      date: data.date,
      duration: data.duration,
      instructions: data.instructions,
      includeBoxNota: data.includeBoxNota ?? false,
      variationsJson: data.variationsJson,
      createdAt: new Date(),
      versions: [],
    };
    this.mockExams.unshift(newExam);
    this.sampleHeaders[newExam.id] = {
      institution: newExam.institution,
      department: newExam.department,
      course: newExam.course,
      discipline: newExam.discipline,
      classGroup: newExam.classGroup,
      semester: newExam.semester,
      title: newExam.title,
      subtitle: newExam.subtitle,
      code: newExam.code,
      date: newExam.date,
      duration: newExam.duration,
      instructions: newExam.instructions,
      includeBoxNota: newExam.includeBoxNota,
    };
    return newExam;
  }

  async updateExam(id: string, data: UpdateExamDTO): Promise<ExamRecordDTO> {
    const idx = this.mockExams.findIndex((e) => e.id === id);
    if (idx === -1) {
      throw new Error('Prova não encontrada.');
    }
    const current = this.mockExams[idx];
    const updated: ExamRecordDTO = {
      ...current,
      ...data,
      instructions: data.instructions ?? current.instructions,
      includeBoxNota: data.includeBoxNota ?? current.includeBoxNota,
    };
    this.mockExams[idx] = updated;
    this.sampleHeaders[id] = {
      institution: updated.institution,
      department: updated.department,
      course: updated.course,
      discipline: updated.discipline,
      classGroup: updated.classGroup,
      semester: updated.semester,
      title: updated.title,
      subtitle: updated.subtitle,
      code: updated.code,
      date: updated.date,
      duration: updated.duration,
      instructions: updated.instructions,
      includeBoxNota: updated.includeBoxNota,
    };
    return updated;
  }

  async deleteExam(id: string): Promise<boolean> {
    const idx = this.mockExams.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.mockExams.splice(idx, 1);
    delete this.sampleHeaders[id];
    return true;
  }

  async getExamById(id: string): Promise<ExamLayoutDTO | null> {
    return this.getExamLayout(id, 'A');
  }

  async getExamHeader(id: string): Promise<ExamHeaderDTO | null> {
    const key = this.sampleHeaders[id] ? id : 'exam-default';
    return this.sampleHeaders[key] || null;
  }

  async getExamQuestions(id: string, versionLetter: ExamVersionLetter = 'A'): Promise<ExamQuestionLayoutDTO[]> {
    let list = [...this.sampleQuestions];
    const letterCode = (versionLetter || 'A').toUpperCase().charCodeAt(0) - 65;
    if (letterCode > 0 && list.length > 0) {
      const shift = letterCode % list.length;
      list = [...list.slice(shift), ...list.slice(0, shift)];
    }

    return list.map((q, idx) => ({
      ...q,
      orderIndex: idx + 1,
    }));
  }

  async getExamLayout(id: string, versionLetter: ExamVersionLetter = 'A'): Promise<ExamLayoutDTO | null> {
    const header = await this.getExamHeader(id);
    if (!header) return null;

    const questions = await this.getExamQuestions(id, versionLetter);

    // Split questions realistically into A4 pages (e.g. 3 questions on page 1 with header, 2 on page 2)
    const isSinglePageExam = id === 'exam-single-page' || id.includes('single') || id.includes('odd');
    const page1Questions = questions.slice(0, 3);
    const page2Questions = questions.slice(3);

    const pages: ExamPageDTO[] = isSinglePageExam
      ? [
          {
            pageNumber: 1,
            totalPages: 1,
            versionLetter,
            isFirstPage: true,
            header,
            questions: page1Questions,
          },
        ]
      : [
          {
            pageNumber: 1,
            totalPages: 2,
            versionLetter,
            isFirstPage: true,
            header,
            questions: page1Questions,
          },
          {
            pageNumber: 2,
            totalPages: 2,
            versionLetter,
            isFirstPage: false,
            questions: page2Questions,
          },
        ];

    const totalPages = pages.length;

    const answerKey: Record<number, 'A' | 'B' | 'C' | 'D' | 'E'> = {};
    questions.forEach((q) => {
      answerKey[q.orderIndex] = q.correctAlternative;
    });

    return {
      examId: id,
      title: header.title,
      versionLetter,
      pageSize: 'A4',
      dimensionsMm: {
        width: 210,
        height: 297,
      },
      dimensionsPx: {
        width: 794,
        height: 1123,
      },
      marginsMm: {
        top: 15,
        bottom: 15,
        left: 15,
        right: 15,
      },
      header,
      totalPages,
      pages,
      qrCodePayload: JSON.stringify({
        appId: 'CORREGE',
        examCode: header.code,
        ver: versionLetter,
        pages: totalPages,
      }),
      answerKey,
    };
  }
}
