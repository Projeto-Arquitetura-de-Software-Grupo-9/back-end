import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email: string;
  nomeCompleto: string;
  role: 'professor';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'correge-jwt-secret-catolica-2026';
}

export function signAuthToken(user: AuthenticatedUser): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      nomeCompleto: user.nomeCompleto,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn }
  );
}

/**
 * Middleware de autenticação Bearer JWT (Feature 1 - Spec SGP Católica).
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next?: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Token de autenticação não fornecido.',
    });
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Token de autenticação inválido.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthenticatedUser;
    if (!decoded?.id || !decoded?.email) {
      res.status(401).json({
        success: false,
        error: 'Token de autenticação malformado.',
      });
      return;
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      nomeCompleto: decoded.nomeCompleto || '',
      role: decoded.role || 'professor',
    };
    if (next) next();
  } catch (err: any) {
    const isExpired = err?.name === 'TokenExpiredError';
    res.status(401).json({
      success: false,
      error: isExpired
        ? 'Sessão expirada. Faça login novamente.'
        : 'Token de autenticação inválido.',
    });
  }
}

/**
 * Rate limiter em janela deslizante contra força bruta em rotas de autenticação.
 */
export function createAuthRateLimiter(options: { windowMs?: number; maxAttempts?: number } = {}) {
  const windowMs = options.windowMs ?? 15 * 60 * 1000;
  const maxAttempts = options.maxAttempts ?? 15;
  const attempts = new Map<string, number[]>();

  return (req: Request, res: Response, next?: NextFunction): void => {
    const ip =
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : undefined) ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown';
    const emailKey = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const key = `${ip}:${emailKey}`;
    const now = Date.now();

    const recent = (attempts.get(key) || []).filter((ts) => now - ts < windowMs);
    if (recent.length >= maxAttempts) {
      res.status(429).json({
        success: false,
        error: 'Muitas tentativas de autenticação. Aguarde alguns minutos e tente novamente.',
      });
      return;
    }

    recent.push(now);
    attempts.set(key, recent);
    if (next) next();
  };
}
