import {
  AnonymizeTeacherResponseDTO,
  SystemSettingsDTO,
  UpdateSettingsRequestDTO,
} from '../../types/settings.dto';

export interface ISettingsRepository {
  getSettings(teacherId?: string): Promise<SystemSettingsDTO>;
  updateSettings(
    teacherId: string,
    data: UpdateSettingsRequestDTO & { omrThreshold?: number; passingGrade?: number }
  ): Promise<SystemSettingsDTO>;
  resetSettings(teacherId?: string): Promise<SystemSettingsDTO>;
  anonymizeTeacher(teacherId?: string): Promise<AnonymizeTeacherResponseDTO>;
}
