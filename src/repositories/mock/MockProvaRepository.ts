import { Decimal } from '@prisma/client/runtime/library';
import { CreateProvaDTO, IProvaRepository, ProvaWithRelations, UpdateProvaDTO } from '../interfaces/IProvaRepository';

export class MockProvaRepository implements IProvaRepository {
  private provas: ProvaWithRelations[] = [
    {
      id: 'exam-catolica-01',
      idProfessor: 'prof-catolica-01',
      idTurma: 'class-1',
      idDisciplina: 'disc-1',
      codigo: '#DIR-CONST-2024.2',
      titulo: 'P1 - Direito Constitucional I',
      dataAplicacao: new Date('2024-10-23'),
      status: 'Pendente',
      embaralharQuestoes: true,
      embaralharAlternativas: true,
      numeroVersoes: 4,
      notaMaxima: new Decimal(10.0),
      disciplina: {
        id: 'disc-1',
        nome: 'Direito Constitucional I',
        codigo: 'DIR-101',
      },
      turma: {
        id: 'class-1',
        nome: 'Turma A - Matutino',
        periodoLetivo: '2026.1',
      },
      questoes: [],
      versoes: [
        {
          id: 'ver-a',
          idProva: 'exam-catolica-01',
          letraVersao: 'A',
          layoutQuestoes: [],
          gabaritoOficial: { '1': 'C', '2': 'B', '3': 'A' },
          payloadQrCode: 'CORREGE|exam-catolica-01|A|HASH123',
        },
        {
          id: 'ver-b',
          idProva: 'exam-catolica-01',
          letraVersao: 'B',
          layoutQuestoes: [],
          gabaritoOficial: { '1': 'B', '2': 'C', '3': 'A' },
          payloadQrCode: 'CORREGE|exam-catolica-01|B|HASH456',
        },
      ],
    },
  ];

  async list(filter?: { idProfessor?: string; idTurma?: string; idDisciplina?: string }): Promise<ProvaWithRelations[]> {
    return this.provas.filter((p) => {
      if (filter?.idProfessor && p.idProfessor !== filter.idProfessor) return false;
      if (filter?.idTurma && p.idTurma !== filter.idTurma) return false;
      if (filter?.idDisciplina && p.idDisciplina !== filter.idDisciplina) return false;
      return true;
    });
  }

  async findById(id: string): Promise<ProvaWithRelations | null> {
    return this.provas.find((p) => p.id === id) || null;
  }

  async create(data: CreateProvaDTO): Promise<ProvaWithRelations> {
    const newProva: ProvaWithRelations = {
      id: `exam-${Date.now()}`,
      idProfessor: data.idProfessor,
      idTurma: data.idTurma,
      idDisciplina: data.idDisciplina,
      codigo: data.codigo,
      titulo: data.titulo,
      dataAplicacao: data.dataAplicacao,
      status: data.status || 'Pendente',
      embaralharQuestoes: data.embaralharQuestoes ?? true,
      embaralharAlternativas: data.embaralharAlternativas ?? true,
      numeroVersoes: data.numeroVersoes || 4,
      notaMaxima: new Decimal(data.notaMaxima || 10.0),
      disciplina: {
        id: data.idDisciplina,
        nome: 'Disciplina Selecionada',
        codigo: 'DISC-SEL',
      },
      turma: {
        id: data.idTurma,
        nome: 'Turma Selecionada',
        periodoLetivo: '2026.1',
      },
      questoes: [],
      versoes: [],
    };
    this.provas.push(newProva);
    return newProva;
  }

  async update(id: string, data: UpdateProvaDTO): Promise<ProvaWithRelations> {
    const idx = this.provas.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new Error(`Prova com ID ${id} não encontrada.`);
    }
    const current = this.provas[idx];
    const updated: ProvaWithRelations = {
      ...current,
      idTurma: data.idTurma || current.idTurma,
      idDisciplina: data.idDisciplina || current.idDisciplina,
      codigo: data.codigo || current.codigo,
      titulo: data.titulo || current.titulo,
      dataAplicacao: data.dataAplicacao || current.dataAplicacao,
      status: data.status || current.status,
      embaralharQuestoes: data.embaralharQuestoes ?? current.embaralharQuestoes,
      embaralharAlternativas: data.embaralharAlternativas ?? current.embaralharAlternativas,
      numeroVersoes: data.numeroVersoes ?? current.numeroVersoes,
      notaMaxima: data.notaMaxima !== undefined ? new Decimal(data.notaMaxima) : current.notaMaxima,
    };
    this.provas[idx] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const prev = this.provas.length;
    this.provas = this.provas.filter((p) => p.id !== id);
    return this.provas.length < prev;
  }
}
