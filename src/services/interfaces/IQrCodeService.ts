import {
  GenerateQrCodeDTO,
  QrCodeResultDTO,
  ValidateQrCodeInputDTO,
  ValidateQrCodeResultDTO,
} from '../../types/qrCode.dto';

/**
 * Service Contract for QR Code generation, cryptographic hashing, and camera payload decoding.
 */
export interface IQrCodeService {
  /**
   * Generates a verifiable QR Code for an exam version or student assignment.
   */
  generateExamQrCode(dto: GenerateQrCodeDTO): Promise<QrCodeResultDTO>;

  /**
   * Retrieves an existing QR Code record by version and optional student ID.
   */
  getQrCodeByVersion(examVersionId: string, studentId?: string): Promise<QrCodeResultDTO | null>;

  /**
   * Validates a raw payload string scanned by the mobile camera app.
   */
  validatePayload(dto: ValidateQrCodeInputDTO): Promise<ValidateQrCodeResultDTO>;
}
