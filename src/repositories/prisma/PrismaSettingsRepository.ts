import { prisma } from '../../config/database';
import {
  AnonymizeTeacherResponseDTO,
  OmrSensitivityLabel,
  SystemSettingsDTO,
  UpdateSettingsRequestDTO,
} from '../../types/settings.dto';
import { ISettingsRepository } from '../interfaces/ISettingsRepository';

export class PrismaSettingsRepository implements ISettingsRepository {
  private readonly defaultData = {
    teacherId: 'usr-prof-1',
    institutionName: 'CATÓLICA DE SANTA CATARINA',
    department: 'Curso de Direito | Departamento de Ciências Jurídicas',
    professorName: 'Prof. Dr. Ricardo Silveira',
    professorEmail: 'ricardo.silveira@catolicasc.org.br',
    passingGrade: 7.0,
    omrSensitivity: 'Alta (Threshold 0.65)',
    omrThreshold: 0.65,
    autoRotate: true,
  };

  private mapToDTO(row: any): SystemSettingsDTO {
    return {
      id: row.id,
      teacherId: row.teacherId,
      institutionName: row.institutionName,
      department: row.department,
      professorName: row.professorName,
      professorEmail: row.professorEmail,
      passingGrade: row.passingGrade,
      omrSensitivity: row.omrSensitivity as OmrSensitivityLabel,
      omrThreshold: row.omrThreshold,
      autoRotate: row.autoRotate,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getSettings(teacherId: string = 'usr-prof-1'): Promise<SystemSettingsDTO> {
    let record = await prisma.settings.findUnique({
      where: { teacherId },
    });

    if (!record) {
      record = await prisma.settings.create({
        data: {
          ...this.defaultData,
          teacherId,
        },
      });
    }

    return this.mapToDTO(record);
  }

  async updateSettings(
    teacherId: string = 'usr-prof-1',
    data: UpdateSettingsRequestDTO & { omrThreshold?: number; passingGrade?: number }
  ): Promise<SystemSettingsDTO> {
    const existing = await this.getSettings(teacherId);

    const updated = await prisma.settings.update({
      where: { teacherId: existing.teacherId },
      data: {
        institutionName:
          data.institutionName !== undefined
            ? data.institutionName.trim()
            : undefined,
        department:
          data.department !== undefined ? data.department.trim() : undefined,
        professorName:
          data.professorName !== undefined
            ? data.professorName.trim()
            : undefined,
        professorEmail:
          data.professorEmail !== undefined
            ? data.professorEmail.trim()
            : undefined,
        passingGrade:
          typeof data.passingGrade === 'number' ? data.passingGrade : undefined,
        omrSensitivity:
          data.omrSensitivity !== undefined ? data.omrSensitivity : undefined,
        omrThreshold:
          data.omrThreshold !== undefined ? data.omrThreshold : undefined,
        autoRotate:
          data.autoRotate !== undefined ? Boolean(data.autoRotate) : undefined,
      },
    });

    return this.mapToDTO(updated);
  }

  async resetSettings(teacherId: string = 'usr-prof-1'): Promise<SystemSettingsDTO> {
    const record = await prisma.settings.upsert({
      where: { teacherId },
      update: { ...this.defaultData, teacherId },
      create: { ...this.defaultData, teacherId },
    });

    return this.mapToDTO(record);
  }

  async anonymizeTeacher(
    teacherId: string = 'usr-prof-1'
  ): Promise<AnonymizeTeacherResponseDTO> {
    await this.getSettings(teacherId);

    const updated = await prisma.settings.update({
      where: { teacherId },
      data: {
        professorName: 'Usuário Anonimizado (LGPD)',
        professorEmail: `anonimo.${teacherId}@catolicasc.org.br`,
      },
    });

    return {
      teacherId,
      professorName: updated.professorName,
      professorEmail: updated.professorEmail,
      anonymizedAt: updated.updatedAt.toISOString(),
      message: 'Os dados pessoais do docente foram anonimizados com sucesso.',
    };
  }
}
