import { IExamVariationRepository } from '../repositories/interfaces/IExamVariationRepository';
import {
  CrossAnswerKeyEntryDTO,
  ExamVariationResultDTO,
  ExamVersionLetter,
  ExamVersionResultDTO,
  GenerateVariationsRequestDTO,
  StudentAssignmentDTO,
  VariationAlternativeDTO,
  VariationQuestionDTO,
} from '../types/examVariation.dto';
import { IExamVariationService } from './interfaces/IExamVariationService';

export class ExamVariationService implements IExamVariationService {
  constructor(private variationRepo: IExamVariationRepository) {}

  async generateVariations(request: GenerateVariationsRequestDTO): Promise<ExamVariationResultDTO> {
    const {
      examId,
      numberOfVersions = 4,
      shuffleQuestions = true,
      shuffleAlternatives = true,
      strategy = 'FISHER_YATES',
      students = [],
    } = request;

    const clampedVersions = Math.min(Math.max(1, numberOfVersions), 4);
    const versionLetters: ExamVersionLetter[] = (['A', 'B', 'C', 'D'] as const).slice(0, clampedVersions);

    const baseQuestions = await this.variationRepo.getBaseQuestions(examId);
    if (!baseQuestions || baseQuestions.length === 0) {
      throw new Error(`Nenhuma questão encontrada para a prova ${examId}.`);
    }

    const versions: ExamVersionResultDTO[] = [];

    // Generate Cadernos
    for (let vIdx = 0; vIdx < versionLetters.length; vIdx++) {
      const letter = versionLetters[vIdx];
      const isBaseVersion = vIdx === 0;

      // 1. Permute questions if enabled and not Version A
      let versionQuestionsList = baseQuestions.map((q) => JSON.parse(JSON.stringify(q)) as VariationQuestionDTO);

      if (shuffleQuestions && !isBaseVersion) {
        versionQuestionsList = this.permuteQuestions(versionQuestionsList, vIdx, strategy);
      }

      // Re-index questions 1..N for this version
      versionQuestionsList = versionQuestionsList.map((q, idx) => ({
        ...q,
        orderIndex: idx + 1,
      }));

      // 2. Permute alternatives if enabled and not Version A
      const processedQuestions = versionQuestionsList.map((q, qIdx) => {
        if (!shuffleAlternatives || isBaseVersion) {
          return q;
        }

        return this.permuteAlternatives(q, vIdx, qIdx);
      });

      // 3. Build answer key for this Caderno
      const answerKey: Record<number, 'A' | 'B' | 'C' | 'D' | 'E'> = {};
      processedQuestions.forEach((q) => {
        answerKey[q.orderIndex] = q.correctAlternative;
      });

      versions.push({
        versionLetter: letter,
        examCode: `#EXAM-${examId}-${letter}`,
        questions: processedQuestions,
        answerKey,
      });
    }

    // 4. Build Cross-Answer-Key Matrix
    const crossAnswerKeyMatrix: CrossAnswerKeyEntryDTO[] = baseQuestions.map((bq, bIdx) => {
      const entry: CrossAnswerKeyEntryDTO = {
        originalQuestionId: bq.originalQuestionId,
        orderIndexA: bIdx + 1,
        correctLetterA: bq.correctAlternative,
      };

      versions.forEach((v) => {
        const found = v.questions.find((q) => q.originalQuestionId === bq.originalQuestionId);
        if (found) {
          if (v.versionLetter === 'B') {
            entry.orderIndexB = found.orderIndex;
            entry.correctLetterB = found.correctAlternative;
          } else if (v.versionLetter === 'C') {
            entry.orderIndexC = found.orderIndex;
            entry.correctLetterC = found.correctAlternative;
          } else if (v.versionLetter === 'D') {
            entry.orderIndexD = found.orderIndex;
            entry.correctLetterD = found.correctAlternative;
          }
        }
      });

      return entry;
    });

    // 5. Assign students round-robin among versions
    const studentAssignments: StudentAssignmentDTO[] = students.map((std, idx) => {
      const assignedVersion = versionLetters[idx % versionLetters.length];
      return {
        studentId: std.id,
        studentName: std.name,
        registration: std.registration,
        assignedVersion,
      };
    });

    const result: ExamVariationResultDTO = {
      examId,
      numberOfVersions: clampedVersions,
      versions,
      crossAnswerKeyMatrix,
      studentAssignments,
      generatedAt: new Date().toISOString(),
    };

    await this.variationRepo.saveVariations(examId, result);
    return result;
  }

  async getVariations(examId: string): Promise<ExamVariationResultDTO | null> {
    return this.variationRepo.getVariations(examId);
  }

  async distributeStudents(
    examId: string,
    students: { id: string; name: string; registration: string }[]
  ): Promise<StudentAssignmentDTO[]> {
    const existing = await this.getVariations(examId);
    const versionLetters: ExamVersionLetter[] = existing
      ? existing.versions.map((v) => v.versionLetter)
      : ['A', 'B', 'C', 'D'];

    return students.map((std, idx) => ({
      studentId: std.id,
      studentName: std.name,
      registration: std.registration,
      assignedVersion: versionLetters[idx % versionLetters.length],
    }));
  }

  /**
   * Permutes questions deterministically per version and strategy
   */
  private permuteQuestions(
    questions: VariationQuestionDTO[],
    versionIndex: number,
    strategy: string
  ): VariationQuestionDTO[] {
    const list = [...questions];
    const n = list.length;
    if (n <= 1) return list;

    if (strategy === 'CYCLIC_ROTATION') {
      const shift = versionIndex % n;
      return [...list.slice(shift), ...list.slice(0, shift)];
    }

    // Deterministic Fisher-Yates with version-based seed offset
    for (let i = n - 1; i > 0; i--) {
      const j = (i * 7 + versionIndex * 13) % (i + 1);
      const temp = list[i];
      list[i] = list[j];
      list[j] = temp;
    }
    return list;
  }

  /**
   * Permutes alternatives while strictly tracking the correct answer text
   */
  private permuteAlternatives(
    q: VariationQuestionDTO,
    versionIndex: number,
    questionIndex: number
  ): VariationQuestionDTO {
    const correctAltText = q.alternatives.find((a) => a.letter === q.correctAlternative)?.text;
    const alts = [...q.alternatives];
    const m = alts.length;

    // Shift/Permute alternatives deterministically
    const shift = (versionIndex * 2 + questionIndex + 1) % m;
    const rotated = [...alts.slice(shift), ...alts.slice(0, shift)];

    const letters: ('A' | 'B' | 'C' | 'D' | 'E')[] = ['A', 'B', 'C', 'D', 'E'];
    let newCorrectLetter: 'A' | 'B' | 'C' | 'D' | 'E' = 'A';

    const newAlternatives: VariationAlternativeDTO[] = rotated.map((alt, idx) => {
      const letter = letters[idx];
      if (alt.text === correctAltText) {
        newCorrectLetter = letter;
      }
      return {
        id: `${q.originalQuestionId}-v${versionIndex}-alt-${idx}`,
        letter,
        text: alt.text,
      };
    });

    return {
      ...q,
      alternatives: newAlternatives,
      correctAlternative: newCorrectLetter,
    };
  }
}
