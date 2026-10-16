import { Request, Response } from 'express';
import { IProvaRepository } from '../repositories/interfaces/IProvaRepository';

export class ProvaCrudController {
  constructor(private readonly repo: IProvaRepository) {}

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const { idProfessor, idTurma, idDisciplina } = req.query as {
        idProfessor?: string;
        idTurma?: string;
        idDisciplina?: string;
      };
      const data = await this.repo.list({ idProfessor, idTurma, idDisciplina });
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao listar provas.' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.repo.findById(id);
      if (!data) {
        res.status(404).json({ success: false, error: 'Prova não encontrada.' });
        return;
      }
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao buscar prova.' });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        idProfessor,
        idTurma,
        idDisciplina,
        codigo,
        titulo,
        dataAplicacao,
        status,
        embaralharQuestoes,
        embaralharAlternativas,
        numeroVersoes,
        notaMaxima,
        questoesIds,
      } = req.body;

      if (!idTurma || !idDisciplina || !titulo) {
        res.status(400).json({
          success: false,
          error: 'Campos idTurma, idDisciplina e titulo são obrigatórios.',
        });
        return;
      }

      const data = await this.repo.create({
        idProfessor: idProfessor || 'prof-catolica-01',
        idTurma,
        idDisciplina,
        codigo: codigo || `#PROVA-${Math.floor(1000 + Math.random() * 9000)}`,
        titulo,
        dataAplicacao: dataAplicacao ? new Date(dataAplicacao) : new Date(),
        status: status || 'Pendente',
        embaralharQuestoes: embaralharQuestoes ?? true,
        embaralharAlternativas: embaralharAlternativas ?? true,
        numeroVersoes: Number(numeroVersoes) || 4,
        notaMaxima: Number(notaMaxima) || 10.0,
        questoesIds,
      });

      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao criar prova.' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const body = { ...req.body };
      if (body.dataAplicacao) {
        body.dataAplicacao = new Date(body.dataAplicacao);
      }
      const data = await this.repo.update(id, body);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao atualizar prova.' });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.repo.delete(id);
      res.status(200).json({ success });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao excluir prova.' });
    }
  };
}
