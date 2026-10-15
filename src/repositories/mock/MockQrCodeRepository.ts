import { IQrCodeRepository } from '../interfaces/IQrCodeRepository';
import { QrCodeResultDTO } from '../../types/qrCode.dto';
import { generateQrCodeSvg } from '../../utils/qrMatrix';

/**
 * In-memory Mock Repository for QR Codes.
 * Used for rapid prototyping and unblocking frontend before database class diagram and migrations are created.
 */
export class MockQrCodeRepository implements IQrCodeRepository {
  private records: Map<string, QrCodeResultDTO> = new Map();

  constructor() {
    this.seedInitialMockData();
  }

  private seedInitialMockData(): void {
    const mockVersions = [
      { appId: 'app-cal-1', vId: 'v-cal-a', ver: 'A' as const, code: '#CAL-1-2024.2' },
      { appId: 'app-cal-1', vId: 'v-cal-b', ver: 'B' as const, code: '#CAL-1-2024.2' },
      { appId: 'app-cal-1', vId: 'v-cal-c', ver: 'C' as const, code: '#CAL-1-2024.2' },
      { appId: 'app-cal-1', vId: 'v-cal-d', ver: 'D' as const, code: '#CAL-1-2024.2' },
      { appId: 'app-dir-1', vId: 'v-dir-a', ver: 'A' as const, code: '#DIR-CONST-2024.2' },
      { appId: 'app-dir-1', vId: 'v-dir-b', ver: 'B' as const, code: '#DIR-CONST-2024.2' },
    ];

    for (const item of mockVersions) {
      const payloadObj = {
        appId: item.appId,
        vId: item.vId,
        ver: item.ver,
        code: item.code,
        ts: 1728500000000,
        chk: 'seed-crc32-ok',
      };
      const rawPayload = JSON.stringify(payloadObj);
      const { svg, dataUrl, size } = generateQrCodeSvg(rawPayload, { size: 180 });

      const record: QrCodeResultDTO = {
        id: `qr-${item.vId}`,
        applicationId: item.appId,
        examVersionId: item.vId,
        versionLetter: item.ver,
        examCode: item.code,
        qrCodePayload: rawPayload,
        publicCode: `PUB-${item.code.replace(/[^A-Za-z0-9]/g, '')}-${item.ver}`,
        svgContent: svg,
        dataUrl,
        matrixDimension: size,
        checksum: 'seed-crc32-ok',
        createdAt: new Date().toISOString(),
      };

      this.records.set(record.id, record);
    }
  }

  async save(qrCode: QrCodeResultDTO): Promise<QrCodeResultDTO> {
    this.records.set(qrCode.id, { ...qrCode });
    return { ...qrCode };
  }

  async findById(id: string): Promise<QrCodeResultDTO | null> {
    const found = this.records.get(id);
    return found ? { ...found } : null;
  }

  async findByVersionAndStudent(examVersionId: string, studentId?: string): Promise<QrCodeResultDTO | null> {
    for (const record of this.records.values()) {
      if (record.examVersionId === examVersionId) {
        if (!studentId && !record.studentId) return { ...record };
        if (studentId && record.studentId === studentId) return { ...record };
      }
    }
    return null;
  }

  async findByPayload(payload: string): Promise<QrCodeResultDTO | null> {
    for (const record of this.records.values()) {
      if (record.qrCodePayload === payload) {
        return { ...record };
      }
    }
    return null;
  }

  async listByApplication(applicationId: string): Promise<QrCodeResultDTO[]> {
    const list: QrCodeResultDTO[] = [];
    for (const record of this.records.values()) {
      if (record.applicationId === applicationId) {
        list.push({ ...record });
      }
    }
    return list;
  }
}
