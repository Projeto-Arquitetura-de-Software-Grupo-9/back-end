import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { IDisciplinaRepository } from '../repositories/interfaces/IDisciplinaRepository';
import { getJwtSecret } from '../middlewares/authMiddleware';

function resolveProfessorId(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7).trim(), getJwtSecret()) as { id?: string };
      if (decoded?.id) return decoded.id;
    } catch {
      // ignore
    }
  }
  return typeof req.body?.idProfessor === 'string' && req.body.idProfessor.trim()
    ? req.body.idProfessor.trim()
    : undefined;
}

export class DisciplinaController {
  constructor(private readonly repo: IDisciplinaRepository) {}

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const idProfessor = req.query.idProfessor as string | undefined;
      const data = await this.repo.list(idProfessor);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao listar disciplinas.' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.repo.findById(id);
      if (!data) {
        res.status(404).json({ success: false, error: 'Disciplina não encontrada.' });
        return;
      }
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao buscar disciplina.' });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { codigo, nome, curso } = req.body;
      const idProfessor = resolveProfessorId(req);
      if (!nome || !codigo || !curso) {
        res.status(400).json({ success: false, error: 'Campos nome, codigo e curso são obrigatórios.' });
        return;
      }
      if (!idProfessor) {
        res.status(400).json({ success: false, error: 'Identificação do professor (idProfessor ou token) é obrigatória.' });
        return;
      }
      const data = await this.repo.create({
        idProfessor,
        codigo,
        nome,
        curso,
      });
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao criar disciplina.' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.repo.update(id, req.body);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao atualizar disciplina.' });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.repo.delete(id);
      res.status(200).json({ success });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao excluir disciplina.' });
    }
  };
}
