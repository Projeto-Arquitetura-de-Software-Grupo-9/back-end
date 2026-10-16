import { prisma } from '../../config/database';
import { CreateQuestaoDTO, IQuestaoRepository, QuestaoWithAlternativas, UpdateQuestaoDTO } from '../interfaces/IQuestaoRepository';

export class PrismaQuestaoRepository implements IQuestaoRepository {
  async list(filter?: { idProfessor?: string; idDisciplina?: string; tipo?: string; dificuldade?: string }): Promise<QuestaoWithAlternativas[]> {
    return prisma.questao.findMany({
      where: {
        idProfessor: filter?.idProfessor,
        idDisciplina: filter?.idDisciplina,
        tipo: filter?.tipo,
        dificuldade: filter?.dificuldade,
      },
      include: {
        alternativas: {
          orderBy: { letra: 'asc' },
        },
        disciplina: {
          select: { id: true, nome: true, codigo: true },
        },
      },
      orderBy: { codigo: 'asc' },
    });
  }

  async findById(id: string): Promise<QuestaoWithAlternativas | null> {
    return prisma.questao.findUnique({
      where: { id },
      include: {
        alternativas: {
          orderBy: { letra: 'asc' },
        },
        disciplina: {
          select: { id: true, nome: true, codigo: true },
        },
      },
    });
  }

  async create(data: CreateQuestaoDTO): Promise<QuestaoWithAlternativas> {
    return prisma.questao.create({
      data: {
        idProfessor: data.idProfessor,
        idDisciplina: data.idDisciplina,
        codigo: data.codigo,
        tipo: data.tipo,
        dificuldade: data.dificuldade,
        enunciado: data.enunciado,
        pontuacao: data.pontuacao,
        alternativas: {
          create: data.alternativas.map((alt) => ({
            letra: alt.letra,
            texto: alt.texto,
            correta: alt.correta,
          })),
        },
      },
      include: {
        alternativas: {
          orderBy: { letra: 'asc' },
        },
        disciplina: {
          select: { id: true, nome: true, codigo: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateQuestaoDTO): Promise<QuestaoWithAlternativas> {
    // If alternatives are provided, recreate them or update
    if (data.alternativas) {
      await prisma.alternativa.deleteMany({
        where: { idQuestao: id },
      });
      await prisma.alternativa.createMany({
        data: data.alternativas.map((alt) => ({
          idQuestao: id,
          letra: alt.letra,
          texto: alt.texto,
          correta: alt.correta,
        })),
      });
    }

    return prisma.questao.update({
      where: { id },
      data: {
        idDisciplina: data.idDisciplina,
        codigo: data.codigo,
        tipo: data.tipo,
        dificuldade: data.dificuldade,
        enunciado: data.enunciado,
        pontuacao: data.pontuacao,
      },
      include: {
        alternativas: {
          orderBy: { letra: 'asc' },
        },
        disciplina: {
          select: { id: true, nome: true, codigo: true },
        },
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await prisma.questao.delete({
      where: { id },
    });
    return !!deleted;
  }
}
