import { ExamVariationResultDTO, VariationQuestionDTO } from '../../types/examVariation.dto';
import { IExamVariationRepository } from '../interfaces/IExamVariationRepository';

export class MockExamVariationRepository implements IExamVariationRepository {
  private inMemoryVariations: Map<string, ExamVariationResultDTO> = new Map();

  private defaultQuestions: VariationQuestionDTO[] = [
    {
      originalQuestionId: 'q-101',
      orderIndex: 1,
      statement: 'A Constituição Federal de 1988 estabelece como princípio fundamental da República Federativa do Brasil:',
      discipline: 'Direito Constitucional',
      topic: 'Princípios Fundamentais',
      difficulty: 'Médio',
      alternatives: [
        { id: 'a1', letter: 'A', text: 'O pluripartidarismo e a soberania nacional.' },
        { id: 'a2', letter: 'B', text: 'A soberania monetária irrestrita dos municípios.' },
        { id: 'a3', letter: 'C', text: 'A centralização judiciária compulsória.' },
        { id: 'a4', letter: 'D', text: 'A dissolução periódica do Congresso Nacional.' },
        { id: 'a5', letter: 'E', text: 'A vedação taxativa a tratados internacionais de direitos humanos.' },
      ],
      correctAlternative: 'A',
    },
    {
      originalQuestionId: 'q-102',
      orderIndex: 2,
      statement: 'Nos termos da Lei 11.101/2005 (Recuperação Judicial e Falência), a sociedade limitada responde:',
      discipline: 'Direito Empresarial',
      topic: 'Sociedades e Responsabilidade',
      difficulty: 'Fácil',
      alternatives: [
        { id: 'b1', letter: 'A', text: 'Solidariamente até o limite total do capital autorizado.' },
        { id: 'b2', letter: 'B', text: 'Limitada ao total do capital social integralizado pelos sócios quotistas.' },
        { id: 'b3', letter: 'C', text: 'Subsidariamente sem benefício de ordem.' },
        { id: 'b4', letter: 'D', text: 'Com o patrimônio pessoal dos sócios em qualquer hipótese civil.' },
        { id: 'b5', letter: 'E', text: 'Apenas mediante caução fiduciária depositada em juízo.' },
      ],
      correctAlternative: 'B',
    },
    {
      originalQuestionId: 'q-103',
      orderIndex: 3,
      statement: 'Em relação aos direitos e garantias fundamentais individuais (artigo 5º da CF/88), a inviolabilidade domiciliar:',
      discipline: 'Direito Constitucional',
      topic: 'Direitos Fundamentais',
      difficulty: 'Difícil',
      alternatives: [
        { id: 'c1', letter: 'A', text: 'É absoluta e não comporta exceções em nenhuma hipótese legal.' },
        { id: 'c2', letter: 'B', text: 'Permite ingresso noturno com ordem judicial fundamentada.' },
        { id: 'c3', letter: 'C', text: 'Admite entrada a qualquer hora em caso de flagrante delito ou desastre.' },
        { id: 'c4', letter: 'D', text: 'Pode ser mitigada por simples deliberação da autoridade policial.' },
        { id: 'c5', letter: 'E', text: 'Depende de autorização do síndico em condomínios edilícios.' },
      ],
      correctAlternative: 'C',
    },
    {
      originalQuestionId: 'q-104',
      orderIndex: 4,
      statement: 'Na recuperação extrajudicial de empresas, o plano aprovado pelos credores representativos de mais da metade dos créditos:',
      discipline: 'Direito Empresarial',
      topic: 'Recuperação Judicial',
      difficulty: 'Médio',
      alternatives: [
        { id: 'd1', letter: 'A', text: 'Obriga todos os credores a ele sujeitos após homologação judicial.' },
        { id: 'd2', letter: 'B', text: 'Necessita de concordância unânime de 100% dos credores quirografários.' },
        { id: 'd3', letter: 'C', text: 'Não tem eficácia perante os credores que expressamente rejeitaram o plano.' },
        { id: 'd4', letter: 'D', text: 'Suspende de imediato apenas execuções fiscais da União.' },
        { id: 'd5', letter: 'E', text: 'Extingue automaticamente as garantias reais prestadas por terceiros.' },
      ],
      correctAlternative: 'A',
    },
  ];

  async getBaseQuestions(_examId: string): Promise<VariationQuestionDTO[]> {
    return JSON.parse(JSON.stringify(this.defaultQuestions));
  }

  async saveVariations(examId: string, result: ExamVariationResultDTO): Promise<void> {
    this.inMemoryVariations.set(examId, result);
  }

  async getVariations(examId: string): Promise<ExamVariationResultDTO | null> {
    return this.inMemoryVariations.get(examId) || null;
  }
}
