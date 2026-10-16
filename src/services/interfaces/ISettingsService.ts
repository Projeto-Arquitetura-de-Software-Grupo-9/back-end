import {
  AnonymizeTeacherResponseDTO,
  SystemSettingsDTO,
  UpdateSettingsRequestDTO,
} from '../../types/settings.dto';

export interface ISettingsService {
  getSettings(teacherId?: string): Promise<SystemSettingsDTO>;
  updateSettings(
    teacherId: string,
    data: UpdateSettingsRequestDTO
  ): Promise<SystemSettingsDTO>;
  resetSettings(teacherId?: string): Promise<SystemSettingsDTO>;
  anonymizeTeacher(teacherId?: string): Promise<AnonymizeTeacherResponseDTO>;
}
