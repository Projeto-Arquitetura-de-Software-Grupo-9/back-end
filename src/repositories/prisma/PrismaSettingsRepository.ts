import { prisma } from '../../config/database';
import {
  AnonymizeTeacherResponseDTO,
  OmrSensitivityLabel,
  SystemSettingsDTO,
  UpdateSettingsRequestDTO,
} from '../../types/settings.dto';
import { ISettingsRepository } from '../interfaces/ISettingsRepository';

export class PrismaSettingsRepository implements ISettingsRepository {
  private readonly defaultInstitutional = {
    institutionName: 'CATÓLICA DE SANTA CATARINA',
    department: '',
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

  private async resolveTeacherProfile(teacherId: string): Promise<{ name: string; email: string }> {
    const prof = await prisma.professor.findUnique({
      where: { id: teacherId },
      select: { nomeCompleto: true, email: true },
    });
    return {
      name: prof?.nomeCompleto || '',
      email: prof?.email || '',
    };
  }

  async getSettings(teacherId: string): Promise<SystemSettingsDTO> {
    let record = await prisma.settings.findUnique({
      where: { teacherId },
    });

    if (!record) {
      const profile = await this.resolveTeacherProfile(teacherId);
      record = await prisma.settings.create({
        data: {
          ...this.defaultInstitutional,
          teacherId,
          professorName: profile.name,
          professorEmail: profile.email,
        },
      });
    }

    return this.mapToDTO(record);
  }

  async updateSettings(
    teacherId: string,
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
            ? data.professorEmail.trim().toLowerCase()
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

  async resetSettings(teacherId: string): Promise<SystemSettingsDTO> {
    const profile = await this.resolveTeacherProfile(teacherId);
    const record = await prisma.settings.upsert({
      where: { teacherId },
      update: {
        ...this.defaultInstitutional,
        professorName: profile.name,
        professorEmail: profile.email,
      },
      create: {
        ...this.defaultInstitutional,
        teacherId,
        professorName: profile.name,
        professorEmail: profile.email,
      },
    });

    return this.mapToDTO(record);
  }

  async anonymizeTeacher(
    teacherId: string
  ): Promise<AnonymizeTeacherResponseDTO> {
    await this.getSettings(teacherId);

    const anonEmail = `anon-${teacherId}@removido.local`;

    const updated = await prisma.settings.update({
      where: { teacherId },
      data: {
        professorName: 'Usuário Removido',
        professorEmail: anonEmail,
      },
    });

    // Also anonymize the professor authentication account if present in DB
    const profExists = await prisma.professor.findUnique({ where: { id: teacherId } });
    if (profExists) {
      await prisma.professor.update({
        where: { id: teacherId },
        data: {
          nomeCompleto: 'Usuário Removido',
          email: anonEmail,
          senhaHash: 'ANONYMIZED_ACCOUNT_LOCKED',
        },
      });
    }

    return {
      teacherId,
      professorName: updated.professorName,
      professorEmail: updated.professorEmail,
      anonymizedAt: updated.updatedAt.toISOString(),
      message: 'Os dados pessoais do docente foram anonimizados com sucesso (LGPD).',
    };
  }
}
