import { Correcao } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { CorrecaoWithRelations, CreateCorrecaoDTO, ICorrecaoRepository } from '../interfaces/ICorrecaoRepository';

export class MockCorrecaoRepository implements ICorrecaoRepository {
  private correcoes: CorrecaoWithRelations[] = [
    {
      id: 'cor-1',
      idVersaoProva: 'ver-a',
      idAluno: 'std-1',
      nomeManuscrito: 'Lucas Ferreira Lima',
      matriculaManuscrita: '2024.1.001',
      notaTotal: new Decimal(9.5),
      respostasLidas: { '1': 'C', '2': 'B', '3': 'A' },
      atribuicaoAutomatica: true,
      dataConfirmacao: new Date('2026-03-10T14:35:00Z'),
      aluno: {
        id: 'std-1',
        nome: 'Lucas Ferreira Lima',
        matricula: '2024.1.001',
        curso: 'Direito',
      },
      versaoProva: {
        id: 'ver-a',
        idProva: 'exam-catolica-01',
        letraVersao: 'A',
        payloadQrCode: 'CORREGE|exam-catolica-01|A|HASH123',
      },
    },
    {
      id: 'cor-2',
      idVersaoProva: 'ver-b',
      idAluno: null, // Pendente de vinculação manual
      nomeManuscrito: 'Ana Beatriz',
      matriculaManuscrita: '2024.1.???',
      notaTotal: new Decimal(8.0),
      respostasLidas: { '1': 'B', '2': 'C', '3': 'D' },
      atribuicaoAutomatica: false,
      dataConfirmacao: new Date('2026-03-10T14:38:00Z'),
      aluno: null,
      versaoProva: {
        id: 'ver-b',
        idProva: 'exam-catolica-01',
        letraVersao: 'B',
        payloadQrCode: 'CORREGE|exam-catolica-01|B|HASH456',
      },
    },
  ];

  async list(filter?: { idVersaoProva?: string; idAluno?: string }): Promise<CorrecaoWithRelations[]> {
    return this.correcoes.filter((c) => {
      if (filter?.idVersaoProva && c.idVersaoProva !== filter.idVersaoProva) return false;
      if (filter?.idAluno && c.idAluno !== filter.idAluno) return false;
      return true;
    });
  }

  async findById(id: string): Promise<CorrecaoWithRelations | null> {
    return this.correcoes.find((c) => c.id === id) || null;
  }

  async create(data: CreateCorrecaoDTO): Promise<Correcao> {
    const item: CorrecaoWithRelations = {
      id: `cor-${Date.now()}`,
      idVersaoProva: data.idVersaoProva,
      idAluno: data.idAluno || null,
      nomeManuscrito: data.nomeManuscrito || null,
      matriculaManuscrita: data.matriculaManuscrita || null,
      notaTotal: new Decimal(data.notaTotal),
      respostasLidas: data.respostasLidas,
      atribuicaoAutomatica: data.atribuicaoAutomatica ?? false,
      dataConfirmacao: new Date(),
    };
    this.correcoes.push(item);
    return item;
  }

  async assignStudent(id: string, idAluno: string): Promise<Correcao> {
    const idx = this.correcoes.findIndex((c) => c.id === id);
    if (idx === -1) {
      throw new Error(`Correção com ID ${id} não encontrada.`);
    }
    this.correcoes[idx].idAluno = idAluno;
    this.correcoes[idx].atribuicaoAutomatica = false;
    return this.correcoes[idx];
  }

  async delete(id: string): Promise<boolean> {
    const prev = this.correcoes.length;
    this.correcoes = this.correcoes.filter((c) => c.id !== id);
    return this.correcoes.length < prev;
  }
}
