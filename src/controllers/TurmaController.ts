import { Request, Response } from 'express';
import { ITurmaRepository } from '../repositories/interfaces/ITurmaRepository';

export class TurmaController {
  constructor(private readonly repo: ITurmaRepository) {}

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const idProfessor = req.query.idProfessor as string | undefined;
      const data = await this.repo.list(idProfessor);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao listar turmas.' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.repo.findById(id);
      if (!data) {
        res.status(404).json({ success: false, error: 'Turma não encontrada.' });
        return;
      }
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao buscar turma.' });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { idProfessor, idDisciplina, nome, periodoLetivo, status } = req.body;
      if (!nome || !idDisciplina || !periodoLetivo) {
        res.status(400).json({ success: false, error: 'Campos nome, idDisciplina e periodoLetivo são obrigatórios.' });
        return;
      }
      const data = await this.repo.create({
        idProfessor: idProfessor || 'prof-catolica-01',
        idDisciplina,
        nome,
        periodoLetivo,
        status,
      });
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao criar turma.' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.repo.update(id, req.body);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao atualizar turma.' });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.repo.delete(id);
      res.status(200).json({ success });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao excluir turma.' });
    }
  };
}
