import { Request, Response } from 'express';
import { IQuestaoRepository } from '../repositories/interfaces/IQuestaoRepository';

export class QuestaoController {
  constructor(private readonly repo: IQuestaoRepository) {}

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const { idProfessor, idDisciplina, tipo, dificuldade } = req.query as {
        idProfessor?: string;
        idDisciplina?: string;
        tipo?: string;
        dificuldade?: string;
      };
      const data = await this.repo.list({ idProfessor, idDisciplina, tipo, dificuldade });
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao listar questões.' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.repo.findById(id);
      if (!data) {
        res.status(404).json({ success: false, error: 'Questão não encontrada.' });
        return;
      }
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao buscar questão.' });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { idProfessor, idDisciplina, codigo, tipo, dificuldade, enunciado, pontuacao, alternativas } = req.body;
      if (!idDisciplina || !enunciado || !alternativas || !Array.isArray(alternativas)) {
        res.status(400).json({ success: false, error: 'Campos idDisciplina, enunciado e alternativas são obrigatórios.' });
        return;
      }
      const data = await this.repo.create({
        idProfessor: idProfessor || 'prof-catolica-01',
        idDisciplina,
        codigo: codigo || `#Q-${Math.floor(1000 + Math.random() * 9000)}`,
        tipo: tipo || 'objetiva',
        dificuldade: dificuldade || 'Médio',
        enunciado,
        pontuacao: Number(pontuacao) || 1.0,
        alternativas,
      });
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao criar questão.' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.repo.update(id, req.body);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao atualizar questão.' });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.repo.delete(id);
      res.status(200).json({ success });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao excluir questão.' });
    }
  };
}
