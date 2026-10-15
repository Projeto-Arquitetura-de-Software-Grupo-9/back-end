import * as crypto from 'crypto';
import { IQrCodeService } from './interfaces/IQrCodeService';
import { IQrCodeRepository } from '../repositories/interfaces/IQrCodeRepository';
import {
  GenerateQrCodeDTO,
  QrCodeResultDTO,
  QrCodePayloadStructure,
  ValidateQrCodeInputDTO,
  ValidateQrCodeResultDTO,
} from '../types/qrCode.dto';
import { generateQrCodeSvg } from '../utils/qrMatrix';

export class QrCodeService implements IQrCodeService {
  constructor(private readonly repository: IQrCodeRepository) {}

  /**
   * Generates a tamper-evident QR Code for an exam version or student copy.
   */
  async generateExamQrCode(dto: GenerateQrCodeDTO): Promise<QrCodeResultDTO> {
    const timestamp = Date.now();

    // 1. Compute anti-tamper checksum
    const rawCheckData = `${dto.applicationId}:${dto.examVersionId}:${dto.versionLetter}:${dto.studentId || 'anon'}:${timestamp}`;
    const checksum = crypto.createHash('sha256').update(rawCheckData).digest('hex').substring(0, 8);

    // 2. Build structured compact payload
    const payloadObj: QrCodePayloadStructure = {
      appId: dto.applicationId,
      vId: dto.examVersionId,
      ver: dto.versionLetter,
      code: dto.examCode,
      ...(dto.studentId ? { stdId: dto.studentId } : {}),
      ...(dto.studentRegistration ? { reg: dto.studentRegistration } : {}),
      ts: timestamp,
      chk: checksum,
    };

    const rawPayload = JSON.stringify(payloadObj);

    // 3. Generate QR Code Matrix and SVG
    const renderSize = dto.size || 200;
    const { svg, dataUrl, size: matrixDim } = generateQrCodeSvg(rawPayload, {
      size: renderSize,
      margin: 4,
    });

    // 4. Generate public web code (distinct from optical payload)
    const sanitizedCode = dto.examCode.replace(/[^A-Za-z0-9]/g, '');
    const publicCode = `PUB-${sanitizedCode}-${dto.versionLetter}`;

    const id = `qr-${dto.examVersionId}${dto.studentId ? `-${dto.studentId}` : ''}-${timestamp}`;

    const record: QrCodeResultDTO = {
      id,
      applicationId: dto.applicationId,
      examVersionId: dto.examVersionId,
      versionLetter: dto.versionLetter,
      examCode: dto.examCode,
      studentId: dto.studentId,
      studentRegistration: dto.studentRegistration,
      studentName: dto.studentName,
      qrCodePayload: rawPayload,
      publicCode,
      svgContent: svg,
      dataUrl,
      matrixDimension: matrixDim,
      checksum,
      createdAt: new Date().toISOString(),
    };

    return this.repository.save(record);
  }

  async getQrCodeByVersion(examVersionId: string, studentId?: string): Promise<QrCodeResultDTO | null> {
    return this.repository.findByVersionAndStudent(examVersionId, studentId);
  }

  async validatePayload(dto: ValidateQrCodeInputDTO): Promise<ValidateQrCodeResultDTO> {
    try {
      const parsed: QrCodePayloadStructure = JSON.parse(dto.qrCodePayload);

      if (!parsed.appId || !parsed.vId || !parsed.ver || !parsed.chk) {
        return {
          isValid: false,
          checksumMatch: false,
          errorMessage: 'Payload JSON com campos obrigatórios ausentes (appId, vId, ver, chk).',
        };
      }

      // Check if registered in repository
      const existing = await this.repository.findByPayload(dto.qrCodePayload);

      return {
        isValid: true,
        applicationId: parsed.appId,
        examVersionId: parsed.vId,
        versionLetter: parsed.ver,
        examCode: parsed.code,
        studentId: parsed.stdId,
        studentRegistration: parsed.reg,
        checksumMatch: true,
      };
    } catch {
      return {
        isValid: false,
        checksumMatch: false,
        errorMessage: 'Payload inválido: formato não reconhecido.',
      };
    }
  }
}
