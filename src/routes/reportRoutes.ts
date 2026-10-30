import { Router } from 'express';
import { prisma } from '../config/database';
import { getActiveDataSource } from '../repositories';
import { buildReport, exportReport, ReportInput } from '../services/ReportService';

export function createReportRouter(load = async (id: string): Promise<ReportInput | null> => {
  return prisma.exam.findUnique({ where: { id }, include: {
    versions: { orderBy: { versionLetter: 'asc' }, include: {
      correcoes: { include: { student: { select: { name: true, registration: true } } } },
    } },
  } });
}) {
  const router = Router();
  router.get('/:examId/results', async (req, res) => {
    if (getActiveDataSource() !== 'database') {
      res.status(503).json({ message: 'Resultados exigem provas e correções persistidas no banco.' }); return;
    }
    if (req.query.format && req.query.format !== 'xlsx') {
      res.status(400).json({ message: 'Formato disponível: xlsx.' }); return;
    }
    try {
      const exam = await load(req.params.examId);
      if (!exam) { res.status(404).json({ message: 'Prova não encontrada no backend. Verifique a persistência com a equipe.' }); return; }
      if (!exam.versions.length) { res.status(409).json({ message: 'A prova ainda não possui cadernos persistidos.' }); return; }
      const report = buildReport(exam);
      if (req.query.format === 'xlsx') {
        const buffer = await exportReport(report);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="resultados.xlsx"');
        res.send(Buffer.from(buffer));
      } else res.json({ data: report });
    } catch (error) {
      console.error('Falha no relatório de resultados:', error);
      res.status(500).json({ message: 'Não foi possível gerar resultados. Verifique banco, correções e gabaritos persistidos.' });
    }
  });
  return router;
}
