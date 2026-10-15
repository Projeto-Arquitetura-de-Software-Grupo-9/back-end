/**
 * Data Transfer Objects (DTOs) for QR Code Generation & Verification
 * Adheres to Spec SGP Católica - Features 6, 8 (Exam Versioning & OMR Camera Scanning)
 */

export type ExamVersionLetter = 'A' | 'B' | 'C' | 'D';

export interface GenerateQrCodeDTO {
  applicationId: string;
  examVersionId: string;
  versionLetter: ExamVersionLetter;
  examCode: string;
  studentId?: string;
  studentRegistration?: string;
  studentName?: string;
  format?: 'svg' | 'png' | 'dataUrl';
  size?: number;
}

export interface QrCodePayloadStructure {
  appId: string;
  vId: string;
  ver: ExamVersionLetter;
  code: string;
  stdId?: string;
  reg?: string;
  ts: number;
  chk: string;
}

export interface QrCodeResultDTO {
  id: string;
  applicationId: string;
  examVersionId: string;
  versionLetter: ExamVersionLetter;
  examCode: string;
  studentId?: string;
  studentRegistration?: string;
  studentName?: string;
  qrCodePayload: string;
  publicCode: string;
  svgContent: string;
  dataUrl: string;
  matrixDimension: number;
  checksum: string;
  createdAt: string;
}

export interface ValidateQrCodeInputDTO {
  qrCodePayload: string;
}

export interface ValidateQrCodeResultDTO {
  isValid: boolean;
  applicationId?: string;
  examVersionId?: string;
  versionLetter?: ExamVersionLetter;
  examCode?: string;
  studentId?: string;
  studentRegistration?: string;
  checksumMatch: boolean;
  errorMessage?: string;
}
