import { QrCodeResultDTO } from '../../types/qrCode.dto';

/**
 * Port / Interface for QR Code Persistence.
 * Decouples domain logic from database implementations (MySQL, Prisma, in-memory, etc.)
 */
export interface IQrCodeRepository {
  /**
   * Persists a newly generated QR Code record.
   */
  save(qrCode: QrCodeResultDTO): Promise<QrCodeResultDTO>;

  /**
   * Retrieves a QR Code by its unique ID.
   */
  findById(id: string): Promise<QrCodeResultDTO | null>;

  /**
   * Finds a QR Code by exam version and optional student ID.
   */
  findByVersionAndStudent(examVersionId: string, studentId?: string): Promise<QrCodeResultDTO | null>;

  /**
   * Finds a QR code by its raw encoded payload (used during mobile camera scanning).
   */
  findByPayload(payload: string): Promise<QrCodeResultDTO | null>;

  /**
   * Lists all QR codes registered for a given application ID.
   */
  listByApplication(applicationId: string): Promise<QrCodeResultDTO[]>;
}
