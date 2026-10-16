import {
  CreateQuestionRequestDTO,
  QuestionDTO,
  QuestionFilterDTO,
  UpdateQuestionRequestDTO,
} from '../../types/question.dto';

export interface IQuestionRepository {
  findAll(filters?: QuestionFilterDTO): Promise<QuestionDTO[]>;
  findById(id: string): Promise<QuestionDTO | null>;
  create(data: CreateQuestionRequestDTO): Promise<QuestionDTO>;
  update(id: string, data: UpdateQuestionRequestDTO): Promise<QuestionDTO | null>;
  delete(id: string): Promise<boolean>;
  getAvailableTags(): Promise<string[]>;
  getAvailableDisciplines(): Promise<string[]>;
}
