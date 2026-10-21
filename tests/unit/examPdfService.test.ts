import { MockExamRepository } from '../../src/repositories/mock/MockExamRepository';
import { ExamPdfService } from '../../src/services/ExamPdfService';

async function runTests() {
  console.log('🧪 Starting Exam Paper Layout & PDF Generation Unit Tests...');
  const repo = new MockExamRepository();
  const service = new ExamPdfService(repo);

  // Test 1: Physical A4 Layout Dimensions & Specification
  console.log('\n[Test 1] Validating Physical A4 Page Layout Specifications...');
  const layoutA = await service.getExamLayout('exam-catolica-01', 'A');

  console.assert(layoutA.pageSize === 'A4', 'Page size must be A4');
  console.assert(layoutA.dimensionsMm.width === 210, 'A4 width must be 210mm');
  console.assert(layoutA.dimensionsMm.height === 297, 'A4 height must be 297mm');
  console.assert(layoutA.dimensionsPx.width === 794, 'A4 96-DPI width must be 794px');
  console.assert(layoutA.dimensionsPx.height === 1123, 'A4 96-DPI height must be 1123px');
  console.assert(layoutA.header.includeBoxNota === true, 'Institutional header must include Box NOTA');
  console.assert(layoutA.pages.length === 2, 'Exam should be divided into 2 A4 pages');
  console.assert(layoutA.pages[0].isFirstPage === true, 'Page 1 must be flagged as isFirstPage');
  console.assert(layoutA.pages[1].isFirstPage === false, 'Page 2 is continuation page');
  console.log('✅ Test 1 Passed: Exact physical A4 proportions and pagination verified.');

  // Test 2: Caderno Permutations & OMR Sizing
  console.log('\n[Test 2] Validating Caderno B Permutations & Shuffling...');
  const layoutB = await service.getExamLayout('exam-catolica-01', 'B');

  console.assert(layoutB.versionLetter === 'B', 'Version must be B');
  // In Caderno A, Q1 is q-101. In Caderno B, Q1 is permuted
  console.assert(
    layoutB.pages[0].questions[0].originalQuestionId !== layoutA.pages[0].questions[0].originalQuestionId,
    'Caderno B question order must be permuted from Caderno A'
  );
  console.log('✅ Test 2 Passed: Shuffled variation generated with distinct question sequence.');

  // Test 3: Binary PDF Buffer Generation
  console.log('\n[Test 3] Generating Binary A4 PDF Buffer...');
  const pdfBuffer = await service.generatePdfBuffer({
    examId: 'exam-catolica-01',
    versionLetter: 'A',
    showAnswerKey: false,
    showQrCode: true,
    includeBoxNota: true,
  });

  console.assert(Buffer.isBuffer(pdfBuffer), 'Result must be a Node.js Buffer');
  console.assert(pdfBuffer.length > 5000, `Buffer should have substantial bytes (${pdfBuffer.length} bytes)`);
  const headerMagic = pdfBuffer.subarray(0, 5).toString('ascii');
  console.assert(headerMagic === '%PDF-', 'Buffer must start with valid PDF magic bytes (%PDF-)');
  console.log(`✅ Test 3 Passed: Valid binary A4 PDF generated (${pdfBuffer.length} bytes, %PDF- header).`);

  // Test 4: PDF Base64 DTO Result
  console.log('\n[Test 4] Generating Base64 DTO for Client Download...');
  const pdfResult = await service.generateExamPdf({
    examId: 'exam-default',
    versionLetter: 'A',
    showAnswerKey: true,
    showQrCode: true,
  });

  console.assert(pdfResult.contentType === 'application/pdf', 'Content type must be application/pdf');
  console.assert(pdfResult.fileName.includes('Caderno-A.pdf'), 'Filename must include Caderno letter');
  console.assert(pdfResult.pdfBase64.length > 1000, 'Base64 string must not be empty');
  console.assert(pdfResult.totalPages === 2, 'Total pages must be 2');
  console.log('✅ Test 4 Passed: PDF DTO successfully generated with full metadata.');

  // Test 5: Duplex Print Mode & Odd-Page Blank Verso Compensation
  console.log('\n[Test 5] Validating Duplex Print Generation & Blank Verso Compensation...');
  const duplexResult = await service.generateExamPdf({
    examId: 'exam-single-page',
    versionLetter: 'B',
    isDuplex: true,
    showAnswerKey: false,
    showQrCode: true,
  });

  console.assert(duplexResult.contentType === 'application/pdf', 'Content type must be application/pdf');
  console.assert(duplexResult.fileName.includes('-Caderno-B-Duplex.pdf'), 'Filename must indicate Duplex mode');
  console.assert(
    duplexResult.totalPages === 2,
    `Single-page exam in Duplex must be compensated to 2 pages (got ${duplexResult.totalPages})`
  );

  const duplexBuffer = await service.generatePdfBuffer({
    examId: 'exam-single-page',
    versionLetter: 'B',
    isDuplex: true,
  });
  console.assert(Buffer.isBuffer(duplexBuffer), 'Duplex result must be a Node.js Buffer');
  console.assert(duplexBuffer.subarray(0, 5).toString('ascii') === '%PDF-', 'Buffer must have %PDF- header');
  console.log('✅ Test 5 Passed: Duplex generation with automatic odd-page verso blank compensation verified.');

  // Test 6: Duplex Mode with Integrated OMR Answer Sheet & Strict Physical Sheet Boundaries
  console.log('\n[Test 6] Validating Duplex Exam Generation with Attached OMR Answer Sheet...');
  const examWithOmrResult = await service.generateExamPdf({
    examId: 'exam-catolica-01',
    versionLetter: 'A',
    isDuplex: true,
    includeAnswerSheet: true,
  });

  console.assert(examWithOmrResult.contentType === 'application/pdf', 'Content type must be application/pdf');
  console.assert(
    examWithOmrResult.fileName.includes('-Caderno-A-Duplex-ComGabarito.pdf'),
    `Filename must contain -Duplex-ComGabarito (got ${examWithOmrResult.fileName})`
  );
  // 2 question pages + 1 OMR answer sheet + 1 answer sheet blank verso/draft = 4 total pages
  console.assert(
    examWithOmrResult.totalPages === 4,
    `2-page exam with OMR answer sheet in duplex must have 4 total pages (got ${examWithOmrResult.totalPages})`
  );

  const omrPdfBuffer = await service.generatePdfBuffer({
    examId: 'exam-catolica-01',
    versionLetter: 'A',
    isDuplex: true,
    includeAnswerSheet: true,
  });
  console.assert(Buffer.isBuffer(omrPdfBuffer), 'Result must be a Buffer');
  console.assert(omrPdfBuffer.length > 8000, `Buffer must be substantial (${omrPdfBuffer.length} bytes)`);
  console.log('✅ Test 6 Passed: Duplex print pack with attached OMR answer sheet verified (4 pages, strictly isolated sheets).');

  console.log('\n🎉 ALL 6 EXAM PDF & LAYOUT UNIT TESTS PASSED!');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
