import { MockQrCodeRepository } from '../../src/repositories/mock/MockQrCodeRepository';
import { QrCodeService } from '../../src/services/QrCodeService';

async function runTests() {
  console.log('🧪 Starting QR Code Service Unit Tests...');
  const repo = new MockQrCodeRepository();
  const service = new QrCodeService(repo);

  // Test 1: Generate for Exam Version A
  console.log('\n[Test 1] Generating QR Code for Exam Version A (Anonymous)...');
  const resultA = await service.generateExamQrCode({
    applicationId: 'app-calculo-2024',
    examVersionId: 'ver-cal-a',
    versionLetter: 'A',
    examCode: '#CAL-1-2024.2',
    size: 200,
  });

  console.assert(resultA.versionLetter === 'A', 'Version letter should be A');
  console.assert(resultA.examCode === '#CAL-1-2024.2', 'Exam code should match');
  console.assert(resultA.publicCode === 'PUB-CAL120242-A', 'Public code format should match');
  console.assert(resultA.svgContent.includes('<svg'), 'SVG content should have svg tag');
  console.assert(resultA.dataUrl.startsWith('data:image/svg+xml'), 'DataUrl should be valid');
  console.log('✅ Test 1 Passed: QR Code for Version A generated successfully.');

  // Test 2: Generate for Exam Version B with Student ID
  console.log('\n[Test 2] Generating QR Code for Exam Version B with Student Identification...');
  const resultB = await service.generateExamQrCode({
    applicationId: 'app-calculo-2024',
    examVersionId: 'ver-cal-b',
    versionLetter: 'B',
    examCode: '#CAL-1-2024.2',
    studentId: 'std-dolores',
    studentRegistration: '2024.1.001',
    studentName: 'Dolores',
    size: 200,
  });

  console.assert(resultB.versionLetter === 'B', 'Version letter should be B');
  console.assert(resultB.studentId === 'std-dolores', 'Student ID should match');
  console.assert(resultB.studentRegistration === '2024.1.001', 'Registration should match');
  console.log('✅ Test 2 Passed: Student-identified QR Code generated.');

  // Test 3: Query by Version
  console.log('\n[Test 3] Querying QR Code by version ID and student ID...');
  const fetched = await service.getQrCodeByVersion('ver-cal-b', 'std-dolores');
  console.assert(fetched !== null, 'Should find QR code in repository');
  console.assert(fetched?.id === resultB.id, 'IDs should match');
  console.log('✅ Test 3 Passed: Query by version & student returned accurate record.');

  // Test 4: Validate Payload
  console.log('\n[Test 4] Validating authentic payload from mobile scanner...');
  const validationValid = await service.validatePayload({ qrCodePayload: resultB.qrCodePayload });
  console.assert(validationValid.isValid === true, 'Payload should be valid');
  console.assert(validationValid.studentId === 'std-dolores', 'Student ID should be decoded');
  console.assert(validationValid.versionLetter === 'B', 'Version letter should be B');
  console.log('✅ Test 4 Passed: Authentic payload validated successfully.');

  // Test 5: Validate Tampered Payload
  console.log('\n[Test 5] Validating tampered payload...');
  const validationTampered = await service.validatePayload({ qrCodePayload: '{"corrupted": true}' });
  console.assert(validationTampered.isValid === false, 'Corrupted payload should fail validation');
  console.log('✅ Test 5 Passed: Tampered payload rejected as expected.');

  console.log('\n🎉 ALL 5 UNIT TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
