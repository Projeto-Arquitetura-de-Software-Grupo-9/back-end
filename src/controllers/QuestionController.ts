import { Request, Response } from 'express';
import { IQuestionService } from '../services/interfaces/IQuestionService';
import { QuestionFilterDTO } from '../types/question.dto';

export class QuestionController {
  constructor(private readonly questionService: IQuestionService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: QuestionFilterDTO = {
        difficulty: req.query.difficulty as string | undefined,
        tag: req.query.tag as string | undefined,
        discipline: req.query.discipline as string | undefined,
        type: req.query.type as string | undefined,
        search: req.query.search as string | undefined,
      };

      const questions = await this.questionService.listQuestions(filters);

      res.status(200).json({
        success: true,
        count: questions.length,
        data: questions,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao listar questões do banco.',
      });
    }
  };

  getTags = async (_req: Request, res: Response): Promise<void> => {
    try {
      const tags = await this.questionService.getAvailableTags();

      res.status(200).json({
        success: true,
        data: tags,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao listar etiquetas disponíveis.',
      });
    }
  };

  getDisciplines = async (_req: Request, res: Response): Promise<void> => {
    try {
      const disciplines = await this.questionService.getAvailableDisciplines();

      res.status(200).json({
        success: true,
        data: disciplines,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao listar disciplinas disponíveis.',
      });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const question = await this.questionService.getQuestionById(id);

      res.status(200).json({
        success: true,
        data: question,
      });
    } catch (err: any) {
      res.status(err.message?.includes('not found') ? 404 : 500).json({
        success: false,
        error: err.message || 'Erro ao buscar questão.',
      });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const created = await this.questionService.createQuestion(req.body);

      res.status(201).json({
        success: true,
        message: 'Questão adicionada ao banco com sucesso.',
        data: created,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Erro ao criar questão.',
      });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updated = await this.questionService.updateQuestion(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Questão atualizada com sucesso.',
        data: updated,
      });
    } catch (err: any) {
      res.status(err.message?.includes('not found') ? 404 : 400).json({
        success: false,
        error: err.message || 'Erro ao atualizar questão.',
      });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.questionService.deleteQuestion(id);

      res.status(200).json({
        success: true,
        message: 'Questão excluída do banco com sucesso.',
      });
    } catch (err: any) {
      res.status(err.message?.includes('not found') ? 404 : 500).json({
        success: false,
        error: err.message || 'Erro ao excluir questão.',
      });
    }
  };
}
