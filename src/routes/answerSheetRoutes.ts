import { Router } from 'express';
import { answerSheetSchema, generateAnswerSheets } from '../services/AnswerSheetPdfService';

export function createAnswerSheetRouter() {
  const router = Router();
  router.post('/pdf', async (req, res) => {
    const parsed = answerSheetSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: 'Dados inválidos para exportar a folha de respostas.', issues: parsed.error.flatten() }); return; }
    try {
      const pdf = await generateAnswerSheets(parsed.data);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="folhas-de-respostas.pdf"');
      res.send(pdf);
    } catch (error) {
      console.error('Falha ao exportar folhas:', error);
      res.status(500).json({ message: 'Não foi possível gerar o PDF.' });
    }
  });
  return router;
}
