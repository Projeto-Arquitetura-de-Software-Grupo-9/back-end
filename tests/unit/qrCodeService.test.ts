import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TestQrCodeRepository } from '../helpers/inMemoryRepositories';
import { QrCodeService } from '../../src/services/QrCodeService';

describe('QR Code Service Unit Tests (Integrity & SHA-256 Anti-Tamper)', () => {
  it('should generate anonymous and nominal QR codes and reject tampered checksums', async () => {
    const repo = new TestQrCodeRepository();
    const service = new QrCodeService(repo);

    // 1. Anonymous QR
    const resultA = await service.generateExamQrCode({
      applicationId: 'app-calculo-2026',
      examVersionId: 'ver-cal-a',
      versionLetter: 'A',
      examCode: '#CAL-1-2026.1',
      size: 200,
    });
    assert.equal(resultA.versionLetter, 'A');
    assert.equal(resultA.publicCode, 'PUB-CAL120261-A');
    assert.ok(resultA.svgContent.includes('<svg'));
    assert.ok(resultA.dataUrl.startsWith('data:image/svg+xml'));

    // 2. Nominal QR
    const resultB = await service.generateExamQrCode({
      applicationId: 'app-calculo-2026',
      examVersionId: 'ver-cal-b',
      versionLetter: 'B',
      examCode: '#CAL-1-2026.1',
      studentId: 'std-101',
      studentRegistration: '2026.1.001',
      studentName: 'Estudante Teste',
      size: 200,
    });
    assert.equal(resultB.studentId, 'std-101');

    // 3. Lookup by version + student
    const fetched = await service.getQrCodeByVersion('ver-cal-b', 'std-101');
    assert.equal(fetched?.id, resultB.id);

    // 4. Authentic payload passes SHA-256 validation
    const valid = await service.validatePayload({ qrCodePayload: resultB.qrCodePayload });
    assert.equal(valid.isValid, true);
    assert.equal(valid.checksumMatch, true);
    assert.equal(valid.studentId, 'std-101');

    // 5. Tampered version letter with original checksum MUST be rejected
    const parsedPayload = JSON.parse(resultB.qrCodePayload);
    parsedPayload.ver = 'C';
    const tampered = await service.validatePayload({ qrCodePayload: JSON.stringify(parsedPayload) });
    assert.equal(tampered.isValid, false);
    assert.equal(tampered.checksumMatch, false);

    // 6. Malformed JSON rejected
    const corrupted = await service.validatePayload({ qrCodePayload: '{"corrupted": true}' });
    assert.equal(corrupted.isValid, false);
  });
});
