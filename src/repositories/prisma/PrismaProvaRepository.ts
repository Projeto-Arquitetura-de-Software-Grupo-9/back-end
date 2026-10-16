import { prisma } from '../../config/database';
import { CreateProvaDTO, IProvaRepository, ProvaWithRelations, UpdateProvaDTO } from '../interfaces/IProvaRepository';

export class PrismaProvaRepository implements IProvaRepository {
  async list(filter?: { idProfessor?: string; idTurma?: string; idDisciplina?: string }): Promise<ProvaWithRelations[]> {
    return prisma.prova.findMany({
      where: {
        idProfessor: filter?.idProfessor,
        idTurma: filter?.idTurma,
        idDisciplina: filter?.idDisciplina,
      },
      include: {
        disciplina: {
          select: { id: true, nome: true, codigo: true },
        },
        turma: {
          select: { id: true, nome: true, periodoLetivo: true },
        },
        questoes: {
          include: {
            questao: {
              include: { alternativas: true },
            },
          },
          orderBy: { ordem: 'asc' },
        },
        versoes: true,
      },
      orderBy: { dataAplicacao: 'desc' },
    });
  }

  async findById(id: string): Promise<ProvaWithRelations | null> {
    return prisma.prova.findUnique({
      where: { id },
      include: {
        disciplina: {
          select: { id: true, nome: true, codigo: true },
        },
        turma: {
          select: { id: true, nome: true, periodoLetivo: true },
        },
        questoes: {
          include: {
            questao: {
              include: { alternativas: true },
            },
          },
          orderBy: { ordem: 'asc' },
        },
        versoes: true,
      },
    });
  }

  async create(data: CreateProvaDTO): Promise<ProvaWithRelations> {
    const questoesCreate = data.questoesIds
      ? data.questoesIds.map((qId, index) => ({
          idQuestao: qId,
          ordem: index + 1,
        }))
      : [];

    return prisma.prova.create({
      data: {
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
        notaMaxima: data.notaMaxima || 10.0,
        questoes: {
          create: questoesCreate,
        },
      },
      include: {
        disciplina: {
          select: { id: true, nome: true, codigo: true },
        },
        turma: {
          select: { id: true, nome: true, periodoLetivo: true },
        },
        questoes: {
          include: {
            questao: {
              include: { alternativas: true },
            },
          },
        },
        versoes: true,
      },
    });
  }

  async update(id: string, data: UpdateProvaDTO): Promise<ProvaWithRelations> {
    return prisma.prova.update({
      where: { id },
      data: {
        idTurma: data.idTurma,
        idDisciplina: data.idDisciplina,
        codigo: data.codigo,
        titulo: data.titulo,
        dataAplicacao: data.dataAplicacao,
        status: data.status,
        embaralharQuestoes: data.embaralharQuestoes,
        embaralharAlternativas: data.embaralharAlternativas,
        numeroVersoes: data.numeroVersoes,
        notaMaxima: data.notaMaxima,
      },
      include: {
        disciplina: {
          select: { id: true, nome: true, codigo: true },
        },
        turma: {
          select: { id: true, nome: true, periodoLetivo: true },
        },
        questoes: true,
        versoes: true,
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await prisma.prova.delete({
      where: { id },
    });
    return !!deleted;
  }
}
