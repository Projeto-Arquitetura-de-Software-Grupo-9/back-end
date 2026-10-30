import { Router } from 'express';
import { getActiveDataSource } from '../repositories';
import { buildReport, exportReport, ReportInput } from '../services/ReportService';
import { listReportExams, loadReportExam } from '../repositories/ReportRepository';

export function createReportRouter(
  load: (id: string) => Promise<ReportInput | null> = loadReportExam,
  list = listReportExams,
) {
  const router = Router();
  router.get('/', async (_req, res) => {
    try { res.json({ data: await list(), dataSource: getActiveDataSource() }); }
    catch (error) { console.error('Falha ao listar provas dos relatórios:', error); res.status(500).json({ message: 'Não foi possível listar as provas dos relatórios.' }); }
  });
  router.get('/:examId/results', async (req, res) => {
    if (req.query.format && req.query.format !== 'xlsx') {
      res.status(400).json({ message: 'Formato disponível: xlsx.' }); return;
    }
    try {
      const exam = await load(req.params.examId);
      if (!exam) { res.status(404).json({ message: 'Prova não encontrada no backend. Verifique a persistência com a equipe.' }); return; }
      if (!exam.versions.length) { res.status(409).json({ message: 'A prova ainda não possui cadernos persistidos.' }); return; }
      const report = buildReport(exam);
      const dataSource = getActiveDataSource();
      if (req.query.format === 'xlsx') {
        const buffer = await exportReport(report, dataSource);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="resultados.xlsx"');
        res.send(Buffer.from(buffer));
      } else res.json({ data: { ...report, dataSource } });
    } catch (error) {
      console.error('Falha no relatório de resultados:', error);
      res.status(500).json({ message: 'Não foi possível gerar resultados. Verifique banco, correções e gabaritos persistidos.' });
    }
  });
  return router;
}
