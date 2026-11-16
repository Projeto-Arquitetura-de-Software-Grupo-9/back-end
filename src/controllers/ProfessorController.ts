import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IProfessorRepository } from '../repositories/interfaces/IProfessorRepository';

export class ProfessorController {
  constructor(private readonly repo: IProfessorRepository) {}

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) {
        res.status(400).json({ success: false, error: 'Email e senha são obrigatórios.' });
        return;
      }

      const professor = await this.repo.findByEmail(email);
      if (!professor) {
        res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
        return;
      }

      let isPasswordValid = false;
      if (professor.senhaHash && professor.senhaHash.startsWith('$2')) {
        isPasswordValid = await bcrypt.compare(senha, professor.senhaHash);
      } else {
        // Compatibilidade com senhas legadas em texto puro (seeds/mock)
        isPasswordValid = (senha === professor.senhaHash);
      }

      if (!isPasswordValid) {
        res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
        return;
      }

      const secret = process.env.JWT_SECRET || 'correge-jwt-secret-catolica-2026';
      const token = jwt.sign(
        { id: professor.id, email: professor.email, nomeCompleto: professor.nomeCompleto },
        secret,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        success: true,
        data: {
          id: professor.id,
          nomeCompleto: professor.nomeCompleto,
          email: professor.email,
          token,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao realizar login.' });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { nomeCompleto, email, senha } = req.body;
      if (!nomeCompleto || !email || !senha) {
        res.status(400).json({ success: false, error: 'Campos nomeCompleto, email e senha são obrigatórios.' });
        return;
      }

      const existing = await this.repo.findByEmail(email);
      if (existing) {
        res.status(409).json({ success: false, error: 'Já existe um professor com este e-mail.' });
        return;
      }

      const senhaHash = await bcrypt.hash(senha, 10);
      const professor = await this.repo.create({
        nomeCompleto,
        email,
        senhaHash,
      });

      res.status(201).json({
        success: true,
        data: {
          id: professor.id,
          nomeCompleto: professor.nomeCompleto,
          email: professor.email,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao cadastrar professor.' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const professor = await this.repo.findById(id);
      if (!professor) {
        res.status(404).json({ success: false, error: 'Professor não encontrado.' });
        return;
      }
      res.status(200).json({
        success: true,
        data: {
          id: professor.id,
          nomeCompleto: professor.nomeCompleto,
          email: professor.email,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao buscar professor.' });
    }
  };
}
