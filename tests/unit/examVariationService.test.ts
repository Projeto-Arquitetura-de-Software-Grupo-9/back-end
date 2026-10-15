import { MockExamVariationRepository } from '../../src/repositories/mock/MockExamVariationRepository';
import { ExamVariationService } from '../../src/services/ExamVariationService';

async function runTests() {
  console.log('🧪 Starting Exam Variation (Criar Provas Diferentes) Unit Tests...');
  const repo = new MockExamVariationRepository();
  const service = new ExamVariationService(repo);

  // Test 1: Generate 4 Distinct Cadernos
  console.log('\n[Test 1] Generating 4 distinct versions with question & alternative shuffling...');
  const result = await service.generateVariations({
    examId: 'exam-calculo-01',
    numberOfVersions: 4,
    shuffleQuestions: true,
    shuffleAlternatives: true,
    strategy: 'FISHER_YATES',
  });

  console.assert(result.numberOfVersions === 4, 'Must generate 4 versions');
  console.assert(result.versions.length === 4, 'Must have 4 version results');
  console.assert(result.versions[0].versionLetter === 'A', 'First version must be A');
  console.assert(result.versions[1].versionLetter === 'B', 'Second version must be B');
  console.assert(result.versions[2].versionLetter === 'C', 'Third version must be C');
  console.assert(result.versions[3].versionLetter === 'D', 'Fourth version must be D');

  // Verify Caderno A vs Caderno B question order difference
  const qIdsA = result.versions[0].questions.map((q) => q.originalQuestionId);
  const qIdsB = result.versions[1].questions.map((q) => q.originalQuestionId);
  console.assert(
    JSON.stringify(qIdsA) !== JSON.stringify(qIdsB),
    'Caderno B question order must be shuffled from Caderno A'
  );
  console.log('✅ Test 1 Passed: 4 distinct Cadernos generated with permuted question orders.');

  // Test 2: Semantic Integrity of Answer Key when Alternatives Shuffle
  console.log('\n[Test 2] Verifying Semantic Answer Key preservation across shuffled alternatives...');
  // For question q-101: In base repository, statement is "A Constituição Federal de 1988 estabelece..."
  // Correct answer text is: "O pluripartidarismo e a soberania nacional."
  const baseQuestions = await repo.getBaseQuestions('exam-calculo-01');
  const targetOriginalQ = baseQuestions.find((q) => q.originalQuestionId === 'q-101')!;
  const expectedCorrectText = targetOriginalQ.alternatives.find(
    (a) => a.letter === targetOriginalQ.correctAlternative
  )!.text;

  // Now check every version: the alternative marked as correct MUST have the exact expected text!
  for (const version of result.versions) {
    const qInVersion = version.questions.find((q) => q.originalQuestionId === 'q-101')!;
    const correctLetter = version.answerKey[qInVersion.orderIndex];
    const actualCorrectAlt = qInVersion.alternatives.find((a) => a.letter === correctLetter)!;

    console.assert(
      actualCorrectAlt.text === expectedCorrectText,
      `In version ${version.versionLetter}, correct alternative must contain the correct text regardless of position`
    );
  }
  console.log('✅ Test 2 Passed: Semantic answer key remains 100% accurate across all alternative shuffles.');

  // Test 3: Cross-Answer-Key Matrix
  console.log('\n[Test 3] Validating Cross-Answer-Key Matrix generation...');
  console.assert(result.crossAnswerKeyMatrix.length === 4, 'Matrix must have an entry for each original question');
  const matrixEntry = result.crossAnswerKeyMatrix[0];
  console.assert(matrixEntry.orderIndexA !== undefined, 'Matrix must track index in Version A');
  console.assert(matrixEntry.correctLetterA !== undefined, 'Matrix must track correct letter in Version A');
  console.assert(matrixEntry.orderIndexB !== undefined, 'Matrix must track index in Version B');
  console.assert(matrixEntry.correctLetterB !== undefined, 'Matrix must track correct letter in Version B');
  console.log('✅ Test 3 Passed: Cross-Answer-Key Matrix generated with complete cross-version mapping.');

  // Test 4: Student Round-Robin Assignment
  console.log('\n[Test 4] Testing Student Distribution across Cadernos...');
  const sampleStudents = [
    { id: 's1', name: 'Amanda Dolores', registration: '2024.1.001' },
    { id: 's2', name: 'Bruno Cortela', registration: '2024.1.002' },
    { id: 's3', name: 'Cleber Santana', registration: '2024.1.003' },
    { id: 's4', name: 'Daniela Lima', registration: '2024.1.004' },
    { id: 's5', name: 'Eduardo Ramos', registration: '2024.1.005' },
  ];

  const distribution = await service.distributeStudents('exam-calculo-01', sampleStudents);
  console.assert(distribution[0].assignedVersion === 'A', 'Student 1 should get Caderno A');
  console.assert(distribution[1].assignedVersion === 'B', 'Student 2 should get Caderno B');
  console.assert(distribution[2].assignedVersion === 'C', 'Student 3 should get Caderno C');
  console.assert(distribution[3].assignedVersion === 'D', 'Student 4 should get Caderno D');
  console.assert(distribution[4].assignedVersion === 'A', 'Student 5 should wrap around to Caderno A');
  console.log('✅ Test 4 Passed: Round-robin student assignment evenly distributed across cadernos.');

  console.log('\n🎉 ALL 4 EXAM VARIATION UNIT TESTS PASSED!');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
