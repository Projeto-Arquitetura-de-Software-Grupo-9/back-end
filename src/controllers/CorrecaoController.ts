import { Request, Response } from 'express';
import { ICorrecaoRepository } from '../repositories/interfaces/ICorrecaoRepository';

const VERSION_LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Normaliza a(s) bolha(s) de caderno lidas na folha de respostas.
 * Aceita 'B' ou ['B']. Mais de uma letra distinta = marcação ambígua.
 */
function parseVersaoMarcada(raw: unknown): { letter: string | null; error?: string } {
  if (raw === undefined || raw === null || raw === '') return { letter: null };
  const list = (Array.isArray(raw) ? raw : [raw]).map((v) => String(v).trim().toUpperCase()).filter(Boolean);
  const unique = Array.from(new Set(list));
  if (unique.some((l) => !VERSION_LETTERS.includes(l))) {
    return { letter: null, error: 'versaoMarcada deve ser A, B, C ou D.' };
  }
  if (unique.length > 1) {
    return { letter: null, error: 'Mais de uma bolha de caderno marcada na folha de respostas.' };
  }
  return { letter: unique[0] ?? null };
}

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
      const { idVersaoProva, idProva, versaoMarcada, idAluno, nomeManuscrito, matriculaManuscrita, notaTotal, respostasLidas, atribuicaoAutomatica } = req.body;
      if (!respostasLidas) {
        res.status(400).json({ success: false, error: 'Campo respostasLidas é obrigatório.' });
        return;
      }

      const parsed = parseVersaoMarcada(versaoMarcada);
      if (parsed.error) {
        res.status(422).json({ success: false, error: parsed.error });
        return;
      }

      // Versão: vem do QR (idVersaoProva) ou é resolvida pela bolha marcada (idProva + versaoMarcada)
      let versaoId: string | undefined = idVersaoProva;
      if (!versaoId) {
        if (!idProva || !parsed.letter) {
          res.status(400).json({
            success: false,
            error: 'Informe idVersaoProva, ou idProva junto com a bolha de caderno marcada (versaoMarcada).',
          });
          return;
        }
        const versao = await this.repo.findVersao(idProva, parsed.letter);
        if (!versao) {
          res.status(404).json({ success: false, error: `Caderno ${parsed.letter} não existe para esta prova.` });
          return;
        }
        versaoId = versao.id;
      }

      const created = await this.repo.create({
        idVersaoProva: versaoId,
        versaoMarcada: parsed.letter,
        idAluno: idAluno || null,
        nomeManuscrito: nomeManuscrito || null,
        matriculaManuscrita: matriculaManuscrita || null,
        notaTotal: Number(notaTotal) || 0.0,
        respostasLidas,
        atribuicaoAutomatica: Boolean(atribuicaoAutomatica),
      });

      // Alerta quando a bolha marcada não bate com o caderno do QR Code
      const full = await this.repo.findById(created.id);
      const letraQr = full?.versaoProva?.versionLetter;
      const versaoDivergente = !!parsed.letter && !!letraQr && letraQr !== parsed.letter;

      res.status(201).json({
        success: true,
        data: { ...created, versaoDivergente },
        ...(versaoDivergente
          ? { aviso: `Bolha marcada (${parsed.letter}) difere do caderno do QR Code (${letraQr}). Revisão manual recomendada.` }
          : {}),
      });
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
