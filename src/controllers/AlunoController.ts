import { Request, Response } from 'express';
import { IAlunoRepository } from '../repositories/interfaces/IAlunoRepository';

export class AlunoController {
  constructor(private readonly repo: IAlunoRepository) {}

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const idTurma = req.query.idTurma as string | undefined;
      const data = idTurma ? await this.repo.listByTurma(idTurma) : await this.repo.listAll();
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao listar alunos.' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.repo.findById(id);
      if (!data) {
        res.status(404).json({ success: false, error: 'Aluno não encontrado.' });
        return;
      }
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao buscar aluno.' });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { idTurma, nome, matricula, email, curso } = req.body;
      if (!idTurma || !nome || !matricula) {
        res.status(400).json({ success: false, error: 'Campos idTurma, nome e matricula são obrigatórios.' });
        return;
      }
      const data = await this.repo.create({
        idTurma,
        nome,
        matricula,
        email: email || `${matricula}@catolicasc.edu.br`,
        curso: curso || 'Graduação',
      });
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao cadastrar aluno.' });
    }
  };

  createBatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const { alunos } = req.body;
      if (!Array.isArray(alunos) || alunos.length === 0) {
        res.status(400).json({ success: false, error: 'Array de alunos é obrigatório.' });
        return;
      }
      const result = await this.repo.createMany(alunos);
      res.status(201).json({ success: true, count: result.count });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao importar alunos em lote.' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.repo.update(id, req.body);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao atualizar aluno.' });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.repo.delete(id);
      res.status(200).json({ success });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao excluir aluno.' });
    }
  };
}
