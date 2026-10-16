import {
  CreateQuestionRequestDTO,
  QuestionDTO,
  QuestionFilterDTO,
  UpdateQuestionRequestDTO,
} from '../../types/question.dto';

export interface IQuestionService {
  listQuestions(filters?: QuestionFilterDTO): Promise<QuestionDTO[]>;
  getQuestionById(id: string): Promise<QuestionDTO>;
  createQuestion(data: CreateQuestionRequestDTO): Promise<QuestionDTO>;
  updateQuestion(id: string, data: UpdateQuestionRequestDTO): Promise<QuestionDTO>;
  deleteQuestion(id: string): Promise<void>;
  getAvailableTags(): Promise<string[]>;
  getAvailableDisciplines(): Promise<string[]>;
}
