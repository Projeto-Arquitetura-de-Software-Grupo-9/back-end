import { ISettingsRepository } from '../repositories/interfaces/ISettingsRepository';
import {
  AnonymizeTeacherResponseDTO,
  OmrSensitivityLabel,
  SystemSettingsDTO,
  UpdateSettingsRequestDTO,
} from '../types/settings.dto';
import { ISettingsService } from './interfaces/ISettingsService';

export class SettingsService implements ISettingsService {
  constructor(private readonly settingsRepository: ISettingsRepository) {}

  private resolveOmrThreshold(sensitivity?: OmrSensitivityLabel): number {
    switch (sensitivity) {
      case 'Média (Threshold 0.50)':
        return 0.5;
      case 'Rigorosa (Threshold 0.80)':
        return 0.8;
      case 'Alta (Threshold 0.65)':
      default:
        return 0.65;
    }
  }

  async getSettings(teacherId: string = 'usr-prof-1'): Promise<SystemSettingsDTO> {
    return this.settingsRepository.getSettings(teacherId);
  }

  async updateSettings(
    teacherId: string = 'usr-prof-1',
    data: UpdateSettingsRequestDTO
  ): Promise<SystemSettingsDTO> {
    let parsedGrade: number | undefined;

    if (data.passingGrade !== undefined) {
      const normalized = String(data.passingGrade).replace(',', '.');
      const numeric = Number(normalized);
      if (Number.isNaN(numeric) || numeric < 0 || numeric > 10) {
        throw new Error('A nota mínima para aprovação deve ser um valor entre 0.0 e 10.0.');
      }
      parsedGrade = numeric;
    }

    if (data.professorEmail !== undefined && !data.professorEmail.includes('@')) {
      throw new Error('Informe um e-mail institucional válido.');
    }

    const omrThreshold =
      data.omrSensitivity !== undefined
        ? this.resolveOmrThreshold(data.omrSensitivity)
        : undefined;

    return this.settingsRepository.updateSettings(teacherId, {
      ...data,
      passingGrade: parsedGrade,
      omrThreshold,
    });
  }

  async resetSettings(teacherId: string = 'usr-prof-1'): Promise<SystemSettingsDTO> {
    return this.settingsRepository.resetSettings(teacherId);
  }

  async anonymizeTeacher(
    teacherId: string = 'usr-prof-1'
  ): Promise<AnonymizeTeacherResponseDTO> {
    return this.settingsRepository.anonymizeTeacher(teacherId);
  }
}
