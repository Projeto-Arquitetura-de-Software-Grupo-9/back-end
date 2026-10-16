import { IQuestionRepository } from '../repositories/interfaces/IQuestionRepository';
import {
  CreateQuestionRequestDTO,
  QuestionDTO,
  QuestionFilterDTO,
  UpdateQuestionRequestDTO,
} from '../types/question.dto';
import { IQuestionService } from './interfaces/IQuestionService';

export class QuestionService implements IQuestionService {
  constructor(private readonly questionRepository: IQuestionRepository) {}

  async listQuestions(filters?: QuestionFilterDTO): Promise<QuestionDTO[]> {
    return this.questionRepository.findAll(filters);
  }

  async getQuestionById(id: string): Promise<QuestionDTO> {
    const question = await this.questionRepository.findById(id);
    if (!question) {
      throw new Error(`Question with id "${id}" not found.`);
    }
    return question;
  }

  async createQuestion(data: CreateQuestionRequestDTO): Promise<QuestionDTO> {
    if (!data.statement || !data.statement.trim()) {
      throw new Error('O enunciado da questão é obrigatório.');
    }
    if (!data.discipline || !data.discipline.trim()) {
      throw new Error('A disciplina da questão é obrigatória.');
    }
    if (!data.difficulty) {
      throw new Error('O nível de dificuldade da questão é obrigatório.');
    }

    const type = data.type || 'objetiva';
    if (type === 'objetiva') {
      if (!data.alternatives || data.alternatives.length < 2) {
        throw new Error(
          'Questões objetivas devem possuir no mínimo 2 alternativas.'
        );
      }
    }

    return this.questionRepository.create(data);
  }

  async updateQuestion(
    id: string,
    data: UpdateQuestionRequestDTO
  ): Promise<QuestionDTO> {
    const updated = await this.questionRepository.update(id, data);
    if (!updated) {
      throw new Error(`Question with id "${id}" not found.`);
    }
    return updated;
  }

  async deleteQuestion(id: string): Promise<void> {
    const deleted = await this.questionRepository.delete(id);
    if (!deleted) {
      throw new Error(`Question with id "${id}" not found.`);
    }
  }

  async getAvailableTags(): Promise<string[]> {
    return this.questionRepository.getAvailableTags();
  }

  async getAvailableDisciplines(): Promise<string[]> {
    return this.questionRepository.getAvailableDisciplines();
  }
}
