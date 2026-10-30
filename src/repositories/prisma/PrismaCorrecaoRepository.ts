import { Correcao } from '@prisma/client';
import { prisma } from '../../config/database';
import { CorrecaoWithRelations, CreateCorrecaoDTO, ExamVersionRefDTO, ICorrecaoRepository } from '../interfaces/ICorrecaoRepository';

export class PrismaCorrecaoRepository implements ICorrecaoRepository {
  async list(filter?: { idVersaoProva?: string; idAluno?: string }): Promise<CorrecaoWithRelations[]> {
    return prisma.correcao.findMany({
      where: {
        idVersaoProva: filter?.idVersaoProva,
        idAluno: filter?.idAluno,
      },
      include: {
        student: {
          select: { id: true, name: true, registration: true, course: true },
        },
        versaoProva: {
          select: { id: true, examId: true, versionLetter: true, qrCodePayload: true },
        },
      },
      orderBy: { dataConfirmacao: 'desc' },
    });
  }

  async findById(id: string): Promise<CorrecaoWithRelations | null> {
    return prisma.correcao.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, name: true, registration: true, course: true },
        },
        versaoProva: {
          select: { id: true, examId: true, versionLetter: true, qrCodePayload: true },
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
        versaoMarcada: data.versaoMarcada ?? null,
      },
    });
  }

  async findVersao(examId: string, versionLetter: string): Promise<ExamVersionRefDTO | null> {
    const v = await prisma.examVersion.findUnique({
      where: { examId_versionLetter: { examId, versionLetter } },
      select: { id: true, examId: true, versionLetter: true },
    });
    return v;
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
