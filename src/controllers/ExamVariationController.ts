import { Request, Response } from 'express';
import { IExamVariationService } from '../services/interfaces/IExamVariationService';
import { GenerateVariationsRequestDTO } from '../types/examVariation.dto';

export class ExamVariationController {
  constructor(private readonly variationService: IExamVariationService) {}

  generate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { numberOfVersions, shuffleQuestions, shuffleAlternatives, strategy, students } = req.body;

      const dto: GenerateVariationsRequestDTO = {
        examId: id,
        numberOfVersions: numberOfVersions ? Number(numberOfVersions) : 4,
        shuffleQuestions: shuffleQuestions !== undefined ? Boolean(shuffleQuestions) : true,
        shuffleAlternatives: shuffleAlternatives !== undefined ? Boolean(shuffleAlternatives) : true,
        strategy,
        students,
      };

      const result = await this.variationService.generateVariations(dto);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao gerar variações da avaliação.',
      });
    }
  };

  get = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.variationService.getVariations(id);

      if (!result) {
        res.status(404).json({
          success: false,
          error: `Nenhuma variação gerada para a avaliação '${id}'.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao consultar variações da avaliação.',
      });
    }
  };

  distribute = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { students } = req.body;

      if (!Array.isArray(students)) {
        res.status(400).json({
          success: false,
          error: 'Parâmetro "students" deve ser um array com a lista de estudantes.',
        });
        return;
      }

      const assignments = await this.variationService.distributeStudents(id, students);

      res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao distribuir alunos entre os cadernos.',
      });
    }
  };
}
