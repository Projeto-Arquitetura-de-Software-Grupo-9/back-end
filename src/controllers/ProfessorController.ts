import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IProfessorRepository } from '../repositories/interfaces/IProfessorRepository';
import {
  AuthenticatedRequest,
  getJwtSecret,
  signAuthToken,
} from '../middlewares/authMiddleware';

const ANONYMIZED_HASH_MARKER = 'ANONYMIZED_ACCOUNT_LOCKED';
const TEACHER_DOMAIN = '@catolicasc.org.br';

function normalizeEmail(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}

function isBcryptHash(hash: string | null | undefined): boolean {
  return Boolean(hash && /^\$2[aby]\$\d{2}\$.{53}$/.test(hash));
}

export class ProfessorController {
  constructor(private readonly repo: IProfessorRepository) {}

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const email = normalizeEmail(req.body?.email);
      const senha = typeof req.body?.senha === 'string'
        ? req.body.senha
        : typeof req.body?.password === 'string'
        ? req.body.password
        : '';

      if (!email || !senha) {
        res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios.' });
        return;
      }

      const professor = await this.repo.findByEmail(email);
      if (!professor || professor.senhaHash === ANONYMIZED_HASH_MARKER) {
        res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
        return;
      }

      if (!isBcryptHash(professor.senhaHash)) {
        res.status(401).json({
          success: false,
          error: 'Credenciais inválidas ou conta sem senha criptografada.',
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(senha, professor.senhaHash);
      if (!isPasswordValid) {
        res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
        return;
      }

      const token = signAuthToken({
        id: professor.id,
        email: professor.email,
        nomeCompleto: professor.nomeCompleto,
        role: 'professor',
      });

      res.status(200).json({
        success: true,
        data: {
          id: professor.id,
          nomeCompleto: professor.nomeCompleto,
          email: professor.email,
          role: 'professor',
          createdAt: professor.createdAt,
          token,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao realizar login.' });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const nomeCompleto = typeof req.body?.nomeCompleto === 'string'
        ? req.body.nomeCompleto.trim()
        : typeof req.body?.fullName === 'string'
        ? req.body.fullName.trim()
        : '';
      const email = normalizeEmail(req.body?.email);
      const senha = typeof req.body?.senha === 'string'
        ? req.body.senha
        : typeof req.body?.password === 'string'
        ? req.body.password
        : '';

      if (!nomeCompleto || !email || !senha) {
        res.status(400).json({
          success: false,
          error: 'Campos nomeCompleto, email e senha são obrigatórios.',
        });
        return;
      }

      if (nomeCompleto.length < 3) {
        res.status(400).json({
          success: false,
          error: 'O nome completo deve conter pelo menos 3 caracteres.',
        });
        return;
      }

      if (!email.endsWith(TEACHER_DOMAIN)) {
        res.status(400).json({
          success: false,
          error: `O e-mail docente deve pertencer ao domínio institucional ${TEACHER_DOMAIN}.`,
        });
        return;
      }

      if (senha.length < 8) {
        res.status(400).json({
          success: false,
          error: 'A senha de acesso deve conter no mínimo 8 caracteres.',
        });
        return;
      }

      const existing = await this.repo.findByEmail(email);
      if (existing) {
        res.status(409).json({
          success: false,
          error: 'Já existe uma conta cadastrada com este e-mail institucional.',
        });
        return;
      }

      const senhaHash = await bcrypt.hash(senha, 10);
      const professor = await this.repo.create({
        nomeCompleto,
        email,
        senhaHash,
      });

      const token = signAuthToken({
        id: professor.id,
        email: professor.email,
        nomeCompleto: professor.nomeCompleto,
        role: 'professor',
      });

      res.status(201).json({
        success: true,
        data: {
          id: professor.id,
          nomeCompleto: professor.nomeCompleto,
          email: professor.email,
          role: 'professor',
          createdAt: professor.createdAt,
          token,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao cadastrar professor.' });
    }
  };

  me = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Usuário não autenticado.' });
        return;
      }

      const professor = await this.repo.findById(userId);
      if (!professor || professor.senhaHash === ANONYMIZED_HASH_MARKER) {
        res.status(401).json({ success: false, error: 'Sessão inválida ou conta anonimizada.' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: professor.id,
          nomeCompleto: professor.nomeCompleto,
          email: professor.email,
          role: 'professor',
          createdAt: professor.createdAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao consultar perfil.' });
    }
  };

  changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Usuário não autenticado.' });
        return;
      }

      const currentPassword = typeof req.body?.currentPassword === 'string'
        ? req.body.currentPassword
        : typeof req.body?.senhaAtual === 'string'
        ? req.body.senhaAtual
        : '';
      const newPassword = typeof req.body?.newPassword === 'string'
        ? req.body.newPassword
        : typeof req.body?.novaSenha === 'string'
        ? req.body.novaSenha
        : '';

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Informe a senha atual e a nova senha.',
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          error: 'A nova senha deve conter no mínimo 8 caracteres.',
        });
        return;
      }

      const professor = await this.repo.findById(userId);
      if (!professor || !isBcryptHash(professor.senhaHash)) {
        res.status(401).json({ success: false, error: 'Conta não encontrada ou inválida.' });
        return;
      }

      const valid = await bcrypt.compare(currentPassword, professor.senhaHash);
      if (!valid) {
        res.status(401).json({ success: false, error: 'Senha atual incorreta.' });
        return;
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await this.repo.updatePassword(professor.id, newHash);

      res.status(200).json({
        success: true,
        message: 'Senha atualizada com sucesso.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao alterar senha.' });
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const email = normalizeEmail(req.body?.email);
      if (!email || !email.endsWith(TEACHER_DOMAIN)) {
        res.status(400).json({
          success: false,
          error: `Informe um e-mail institucional válido (${TEACHER_DOMAIN}).`,
        });
        return;
      }

      const professor = await this.repo.findByEmail(email);
      if (!professor || professor.senhaHash === ANONYMIZED_HASH_MARKER) {
        res.status(404).json({
          success: false,
          error: 'Nenhuma conta ativa encontrada com este e-mail institucional.',
        });
        return;
      }

      // Token de uso único: assinado com JWT_SECRET + hash atual (invalida automaticamente após troca)
      const resetSecret = `${getJwtSecret()}:${professor.senhaHash}`;
      const resetToken = jwt.sign(
        { sub: professor.id, email: professor.email, purpose: 'password_reset' },
        resetSecret,
        { expiresIn: '15m' }
      );

      if (!process.env.SMTP_HOST) {
        // Nunca simular envio nem vazar código de teste em produção
        void resetToken;
        res.status(503).json({
          success: false,
          code: 'SMTP_NOT_CONFIGURED',
          error:
            'Serviço de envio de e-mail institucional (SMTP) não configurado neste servidor. Contate o suporte de TI da Católica SC ou altere sua senha autenticado em Configurações.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Instruções de recuperação enviadas para o seu e-mail institucional.',
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao processar recuperação de senha.',
      });
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const email = normalizeEmail(req.body?.email);
      const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
      const newPassword = typeof req.body?.newPassword === 'string'
        ? req.body.newPassword
        : typeof req.body?.novaSenha === 'string'
        ? req.body.novaSenha
        : '';

      if (!email || !token || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Informe e-mail, token de recuperação e nova senha.',
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          error: 'A nova senha deve conter no mínimo 8 caracteres.',
        });
        return;
      }

      const professor = await this.repo.findByEmail(email);
      if (!professor || professor.senhaHash === ANONYMIZED_HASH_MARKER) {
        res.status(400).json({ success: false, error: 'Token de recuperação inválido ou expirado.' });
        return;
      }

      const resetSecret = `${getJwtSecret()}:${professor.senhaHash}`;
      try {
        const decoded = jwt.verify(token, resetSecret) as {
          sub?: string;
          email?: string;
          purpose?: string;
        };
        if (decoded.purpose !== 'password_reset' || decoded.sub !== professor.id) {
          res.status(400).json({ success: false, error: 'Token de recuperação inválido.' });
          return;
        }
      } catch {
        res.status(400).json({ success: false, error: 'Token de recuperação inválido ou expirado.' });
        return;
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await this.repo.updatePassword(professor.id, newHash);

      res.status(200).json({
        success: true,
        message: 'Senha redefinida com sucesso. Você já pode realizar login.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao redefinir senha.' });
    }
  };

  anonymizeMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Usuário não autenticado.' });
        return;
      }

      const professor = await this.repo.findById(userId);
      if (!professor) {
        res.status(404).json({ success: false, error: 'Conta não encontrada.' });
        return;
      }

      const anonymized = await this.repo.anonymize(professor.id);
      res.status(200).json({
        success: true,
        data: {
          id: anonymized.id,
          nomeCompleto: anonymized.nomeCompleto,
          email: anonymized.email,
          anonymizedAt: new Date().toISOString(),
        },
        message: 'Conta anonimizada com sucesso (LGPD). O acesso foi revogado permanentemente.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao anonimizar conta.' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const professor = await this.repo.findById(id);
      if (!professor || professor.senhaHash === ANONYMIZED_HASH_MARKER) {
        res.status(404).json({ success: false, error: 'Professor não encontrado.' });
        return;
      }
      res.status(200).json({
        success: true,
        data: {
          id: professor.id,
          nomeCompleto: professor.nomeCompleto,
          email: professor.email,
          role: 'professor',
          createdAt: professor.createdAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao buscar professor.' });
    }
  };
}
