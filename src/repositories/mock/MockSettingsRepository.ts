import {
  AnonymizeTeacherResponseDTO,
  SystemSettingsDTO,
  UpdateSettingsRequestDTO,
} from '../../types/settings.dto';
import { ISettingsRepository } from '../interfaces/ISettingsRepository';

export class MockSettingsRepository implements ISettingsRepository {
  private readonly defaultSettings: SystemSettingsDTO = {
    id: 'cfg-catolica-01',
    teacherId: 'usr-prof-1',
    institutionName: 'CATÓLICA DE SANTA CATARINA',
    department: 'Curso de Direito | Departamento de Ciências Jurídicas',
    professorName: 'Prof. Dr. Ricardo Silveira',
    professorEmail: 'ricardo.silveira@catolicasc.org.br',
    passingGrade: 7.0,
    omrSensitivity: 'Alta (Threshold 0.65)',
    omrThreshold: 0.65,
    autoRotate: true,
    updatedAt: new Date().toISOString(),
  };

  private settingsByTeacher: Map<string, SystemSettingsDTO> = new Map([
    ['usr-prof-1', { ...this.defaultSettings }],
  ]);

  async getSettings(teacherId: string = 'usr-prof-1'): Promise<SystemSettingsDTO> {
    const existing = this.settingsByTeacher.get(teacherId);
    if (existing) {
      return { ...existing };
    }
    const created: SystemSettingsDTO = {
      ...this.defaultSettings,
      id: `cfg-${teacherId}`,
      teacherId,
      updatedAt: new Date().toISOString(),
    };
    this.settingsByTeacher.set(teacherId, created);
    return { ...created };
  }

  async updateSettings(
    teacherId: string = 'usr-prof-1',
    data: UpdateSettingsRequestDTO & { omrThreshold?: number; passingGrade?: number }
  ): Promise<SystemSettingsDTO> {
    const current = await this.getSettings(teacherId);

    const updated: SystemSettingsDTO = {
      ...current,
      institutionName:
        data.institutionName !== undefined
          ? data.institutionName.trim()
          : current.institutionName,
      department:
        data.department !== undefined ? data.department.trim() : current.department,
      professorName:
        data.professorName !== undefined
          ? data.professorName.trim()
          : current.professorName,
      professorEmail:
        data.professorEmail !== undefined
          ? data.professorEmail.trim()
          : current.professorEmail,
      passingGrade:
        typeof data.passingGrade === 'number'
          ? data.passingGrade
          : current.passingGrade,
      omrSensitivity:
        data.omrSensitivity !== undefined
          ? data.omrSensitivity
          : current.omrSensitivity,
      omrThreshold:
        data.omrThreshold !== undefined ? data.omrThreshold : current.omrThreshold,
      autoRotate:
        data.autoRotate !== undefined ? Boolean(data.autoRotate) : current.autoRotate,
      updatedAt: new Date().toISOString(),
    };

    this.settingsByTeacher.set(teacherId, updated);
    return { ...updated };
  }

  async resetSettings(teacherId: string = 'usr-prof-1'): Promise<SystemSettingsDTO> {
    const reset: SystemSettingsDTO = {
      ...this.defaultSettings,
      teacherId,
      updatedAt: new Date().toISOString(),
    };
    this.settingsByTeacher.set(teacherId, reset);
    return { ...reset };
  }

  async anonymizeTeacher(
    teacherId: string = 'usr-prof-1'
  ): Promise<AnonymizeTeacherResponseDTO> {
    const current = await this.getSettings(teacherId);
    const anonymizedAt = new Date().toISOString();
    const updated: SystemSettingsDTO = {
      ...current,
      professorName: 'Usuário Anonimizado (LGPD)',
      professorEmail: `anonimo.${teacherId}@catolicasc.org.br`,
      updatedAt: anonymizedAt,
    };
    this.settingsByTeacher.set(teacherId, updated);

    return {
      teacherId,
      professorName: updated.professorName,
      professorEmail: updated.professorEmail,
      anonymizedAt,
      message: 'Os dados pessoais do docente foram anonimizados com sucesso.',
    };
  }
}
