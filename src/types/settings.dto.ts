export type OmrSensitivityLabel =
  | 'Alta (Threshold 0.65)'
  | 'Média (Threshold 0.50)'
  | 'Rigorosa (Threshold 0.80)';

export interface SystemSettingsDTO {
  id: string;
  teacherId: string;
  institutionName: string;
  department: string;
  professorName: string;
  professorEmail: string;
  passingGrade: number;
  omrSensitivity: OmrSensitivityLabel;
  omrThreshold: number;
  autoRotate: boolean;
  updatedAt: string;
}

export interface UpdateSettingsRequestDTO {
  institutionName?: string;
  department?: string;
  professorName?: string;
  professorEmail?: string;
  passingGrade?: number | string;
  omrSensitivity?: OmrSensitivityLabel;
  autoRotate?: boolean;
}

export interface AnonymizeTeacherResponseDTO {
  teacherId: string;
  professorName: string;
  professorEmail: string;
  anonymizedAt: string;
  message: string;
}
