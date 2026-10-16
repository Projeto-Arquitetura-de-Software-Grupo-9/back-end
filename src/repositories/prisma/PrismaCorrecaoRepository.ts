import { Correcao } from '@prisma/client';
import { prisma } from '../../config/database';
import { CorrecaoWithRelations, CreateCorrecaoDTO, ICorrecaoRepository } from '../interfaces/ICorrecaoRepository';

export class PrismaCorrecaoRepository implements ICorrecaoRepository {
  async list(filter?: { idVersaoProva?: string; idAluno?: string }): Promise<CorrecaoWithRelations[]> {
    return prisma.correcao.findMany({
      where: {
        idVersaoProva: filter?.idVersaoProva,
        idAluno: filter?.idAluno,
      },
      include: {
        aluno: {
          select: { id: true, nome: true, matricula: true, curso: true },
        },
        versaoProva: {
          select: { id: true, idProva: true, letraVersao: true, payloadQrCode: true },
        },
      },
      orderBy: { dataConfirmacao: 'desc' },
    });
  }

  async findById(id: string): Promise<CorrecaoWithRelations | null> {
    return prisma.correcao.findUnique({
      where: { id },
      include: {
        aluno: {
          select: { id: true, nome: true, matricula: true, curso: true },
        },
        versaoProva: {
          select: { id: true, idProva: true, letraVersao: true, payloadQrCode: true },
        },
      },
    });
  }

  async create(data: CreateCorrecaoDTO): Promise<Correcao> {
    return prisma.correcao.create({
      data: {
        idVersaoProva: data.idVersaoProva,
        idAluno: data.idAluno || null,
        nomeManuscrito: data.nomeManuscrito || null,
        matriculaManuscrita: data.matriculaManuscrita || null,
        notaTotal: data.notaTotal,
        respostasLidas: data.respostasLidas,
        atribuicaoAutomatica: data.atribuicaoAutomatica ?? false,
      },
    });
  }

  async assignStudent(id: string, idAluno: string): Promise<Correcao> {
    return prisma.correcao.update({
      where: { id },
      data: {
        idAluno,
        atribuicaoAutomatica: false,
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await prisma.correcao.delete({
      where: { id },
    });
    return !!deleted;
  }
}
