import { prisma } from '../../config/database';
import { ExamVersionLetter, QrCodeResultDTO } from '../../types/qrCode.dto';
import { IQrCodeRepository } from '../interfaces/IQrCodeRepository';

export class PrismaQrCodeRepository implements IQrCodeRepository {
  private mapToDTO(row: any): QrCodeResultDTO {
    return {
      id: row.id,
      applicationId: row.applicationId,
      examVersionId: row.examVersionId,
      versionLetter: row.versionLetter as ExamVersionLetter,
      examCode: row.examCode,
      studentId: row.studentId || undefined,
      studentRegistration: row.studentRegistration || undefined,
      studentName: row.studentName || undefined,
      qrCodePayload: row.qrCodePayload,
      publicCode: row.publicCode,
      svgContent: row.svgContent,
      dataUrl: row.dataUrl,
      matrixDimension: row.matrixDimension,
      checksum: row.checksum,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async save(qrCode: QrCodeResultDTO): Promise<QrCodeResultDTO> {
    const saved = await prisma.qrCode.upsert({
      where: { id: qrCode.id },
      update: {
        applicationId: qrCode.applicationId,
        examVersionId: qrCode.examVersionId,
        versionLetter: qrCode.versionLetter,
        examCode: qrCode.examCode,
        studentId: qrCode.studentId || null,
        studentRegistration: qrCode.studentRegistration || null,
        studentName: qrCode.studentName || null,
        qrCodePayload: qrCode.qrCodePayload,
        publicCode: qrCode.publicCode,
        svgContent: qrCode.svgContent,
        dataUrl: qrCode.dataUrl,
        matrixDimension: qrCode.matrixDimension,
        checksum: qrCode.checksum,
      },
      create: {
        id: qrCode.id,
        applicationId: qrCode.applicationId,
        examVersionId: qrCode.examVersionId,
        versionLetter: qrCode.versionLetter,
        examCode: qrCode.examCode,
        studentId: qrCode.studentId || null,
        studentRegistration: qrCode.studentRegistration || null,
        studentName: qrCode.studentName || null,
        qrCodePayload: qrCode.qrCodePayload,
        publicCode: qrCode.publicCode,
        svgContent: qrCode.svgContent,
        dataUrl: qrCode.dataUrl,
        matrixDimension: qrCode.matrixDimension,
        checksum: qrCode.checksum,
      },
    });
    return this.mapToDTO(saved);
  }

  async findById(id: string): Promise<QrCodeResultDTO | null> {
    const found = await prisma.qrCode.findUnique({ where: { id } });
    return found ? this.mapToDTO(found) : null;
  }

  async findByVersionAndStudent(
    examVersionId: string,
    studentId?: string
  ): Promise<QrCodeResultDTO | null> {
    const found = await prisma.qrCode.findFirst({
      where: {
        examVersionId,
        studentId: studentId || null,
      },
    });
    return found ? this.mapToDTO(found) : null;
  }

  async findByPayload(payload: string): Promise<QrCodeResultDTO | null> {
    const found = await prisma.qrCode.findFirst({
      where: { qrCodePayload: payload },
    });
    return found ? this.mapToDTO(found) : null;
  }

  async listByApplication(applicationId: string): Promise<QrCodeResultDTO[]> {
    const rows = await prisma.qrCode.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.mapToDTO(r));
  }
}
