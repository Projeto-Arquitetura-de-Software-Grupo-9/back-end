import { Request, Response } from 'express';
import { IStudentService } from '../services/interfaces/IStudentService';
import { StudentFilterDTO } from '../types/student.dto';

export class StudentController {
  constructor(private readonly studentService: IStudentService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: StudentFilterDTO = {
        discipline: req.query.discipline as string | undefined,
        classGroup: req.query.classGroup as string | undefined,
        course: req.query.course as string | undefined,
        search: req.query.search as string | undefined,
      };

      const students = await this.studentService.listStudents(filters);

      res.status(200).json({
        success: true,
        count: students.length,
        data: students,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao listar alunos cadastrados.',
      });
    }
  };

  getDisciplines = async (_req: Request, res: Response): Promise<void> => {
    try {
      const disciplines = await this.studentService.getDisciplines();
      res.status(200).json({
        success: true,
        data: disciplines,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao buscar disciplinas dos alunos.',
      });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const student = await this.studentService.getStudentById(id);

      res.status(200).json({
        success: true,
        data: student,
      });
    } catch (err: any) {
      res.status(err.message?.includes('not found') ? 404 : 500).json({
        success: false,
        error: err.message || 'Erro ao buscar aluno.',
      });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const created = await this.studentService.createStudent(req.body);

      res.status(201).json({
        success: true,
        message: 'Aluno cadastrado com sucesso.',
        data: created,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Erro ao cadastrar novo aluno.',
      });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updated = await this.studentService.updateStudent(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Dados do aluno atualizados com sucesso.',
        data: updated,
      });
    } catch (err: any) {
      res.status(err.message?.includes('not found') ? 404 : 400).json({
        success: false,
        error: err.message || 'Erro ao atualizar dados do aluno.',
      });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.studentService.deleteStudent(id);

      res.status(200).json({
        success: true,
        message: 'Aluno excluído com sucesso.',
      });
    } catch (err: any) {
      res.status(err.message?.includes('not found') ? 404 : 500).json({
        success: false,
        error: err.message || 'Erro ao excluir aluno.',
      });
    }
  };

  deleteBatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const ids: string[] = req.body.ids || req.body.studentIds || [];
      const result = await this.studentService.deleteStudentsBatch(ids);

      res.status(200).json({
        success: true,
        message: `${result.deletedCount} aluno(s) excluído(s) com sucesso.`,
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Erro ao excluir alunos selecionados.',
      });
    }
  };

  importStudents = async (req: Request, res: Response): Promise<void> => {
    try {
      // Support both multipart file upload (.xlsx) and JSON array body
      const file = (req as any).file as Express.Multer.File | undefined;

      if (file && file.buffer) {
        const result = await this.studentService.importStudentsFromExcelBuffer(
          file.buffer
        );
        res.status(201).json({
          success: true,
          message: `${result.importedCount} alunos importados da planilha com sucesso.`,
          data: result,
        });
        return;
      }

      const students = Array.isArray(req.body)
        ? req.body
        : req.body.students || [];
      const result = await this.studentService.importStudents(students);

      res.status(201).json({
        success: true,
        message: `${result.importedCount} alunos importados com sucesso.`,
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Erro ao importar lista de alunos.',
      });
    }
  };

  exportExcel = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: StudentFilterDTO = {
        discipline: req.query.discipline as string | undefined,
        classGroup: req.query.classGroup as string | undefined,
        search: req.query.search as string | undefined,
      };

      const buffer = await this.studentService.exportStudentsToExcelBuffer(
        filters
      );

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="alunos_cadastrados.xlsx"'
      );
      res.setHeader('Content-Length', String(buffer.length));
      res.send(buffer);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao exportar planilha de alunos.',
      });
    }
  };
}
