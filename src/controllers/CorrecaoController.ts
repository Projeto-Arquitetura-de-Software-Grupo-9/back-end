import { Request, Response } from 'express';
import { ICorrecaoRepository } from '../repositories/interfaces/ICorrecaoRepository';

export class CorrecaoController {
  constructor(private readonly repo: ICorrecaoRepository) {}

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const { idVersaoProva, idAluno } = req.query as { idVersaoProva?: string; idAluno?: string };
      const data = await this.repo.list({ idVersaoProva, idAluno });
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao listar correções.' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.repo.findById(id);
      if (!data) {
        res.status(404).json({ success: false, error: 'Correção não encontrada.' });
        return;
      }
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao buscar correção.' });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { idVersaoProva, idAluno, nomeManuscrito, matriculaManuscrita, notaTotal, respostasLidas, atribuicaoAutomatica } = req.body;
      if (!idVersaoProva || !respostasLidas) {
        res.status(400).json({
          success: false,
          error: 'Campos idVersaoProva e respostasLidas são obrigatórios.',
        });
        return;
      }

      const data = await this.repo.create({
        idVersaoProva,
        idAluno: idAluno || null,
        nomeManuscrito: nomeManuscrito || null,
        matriculaManuscrita: matriculaManuscrita || null,
        notaTotal: Number(notaTotal) || 0.0,
        respostasLidas,
        atribuicaoAutomatica: Boolean(atribuicaoAutomatica),
      });

      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao registrar correção.' });
    }
  };

  assignStudent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { idAluno } = req.body;
      if (!idAluno) {
        res.status(400).json({ success: false, error: 'Campo idAluno é obrigatório.' });
        return;
      }

      const data = await this.repo.assignStudent(id, idAluno);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao vincular aluno manualmente.' });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.repo.delete(id);
      res.status(200).json({ success });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao excluir correção.' });
    }
  };
}
