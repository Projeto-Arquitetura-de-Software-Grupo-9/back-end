import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { MockStudentRepository } from '../repositories/mock/MockStudentRepository';
import { MockQuestionRepository } from '../repositories/mock/MockQuestionRepository';
import { MockQrCodeRepository } from '../repositories/mock/MockQrCodeRepository';

dotenv.config();

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url:
          process.env.DATABASE_URL ||
          'mysql://root:root@127.0.0.1:3306/sgp_catolica',
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}

export async function connectDatabase(): Promise<boolean> {
  try {
    await prisma.$connect();
    console.log('✅ Connected to MySQL database at 127.0.0.1:3306 (sgp_catolica)');
    return true;
  } catch (err: any) {
    console.error('❌ Failed to connect to MySQL database:', err.message);
    return false;
  }
}

export async function seedDatabaseIfEmpty(): Promise<void> {
  try {
    // 1. Seed Settings
    const settingsCount = await prisma.settings.count();
    if (settingsCount === 0) {
      await prisma.settings.create({
        data: {
          id: 'cfg-catolica-01',
          teacherId: 'usr-prof-1',
          institutionName: 'CATÓLICA DE SANTA CATARINA',
          department: 'Curso de Direito | Departamento de Ciências Jurídicas',
          professorName: 'Prof. Dr. Ricardo Silveira',
          professorEmail: 'ricardo.silveira@catolicasc.org.br',
          passingGrade: 7.0,
          omrSensitivity: 'Alta (Threshold 0.65)',
          omrThreshold: 0.65,
          autoRotate: true,
        },
      });
      console.log('🌱 Seeded table: configuracoes');
    }

    // 2. Seed Students
    const studentCount = await prisma.student.count();
    if (studentCount === 0) {
      const mockStudentRepo = new MockStudentRepository();
      const initialStudents = await mockStudentRepo.findAll();
      for (const s of initialStudents) {
        await prisma.student.create({
          data: {
            id: s.id,
            name: s.name,
            registration: s.registration,
            course: s.course,
            email: s.email,
            classGroup: s.classGroup,
            discipline: s.discipline,
            examsTaken: s.examsTaken,
            overallAverage: s.overallAverage,
          },
        });
      }
      console.log(`🌱 Seeded table: alunos (${initialStudents.length} records)`);
    }

    // 3. Seed Questions & Alternatives
    const questionCount = await prisma.question.count();
    if (questionCount === 0) {
      const mockQuestionRepo = new MockQuestionRepository();
      const initialQuestions = await mockQuestionRepo.findAll();
      for (const q of initialQuestions) {
        await prisma.question.create({
          data: {
            id: q.id,
            teacherId: q.teacherId || 'usr-prof-1',
            code: q.code,
            type: q.type,
            discipline: q.discipline,
            difficulty: q.difficulty,
            topic: q.topic || 'Geral',
            tags: q.tags,
            statement: q.statement,
            correctAlternative: q.correctAlternative,
            points: q.points,
            maxScore: q.maxScore ?? q.points,
            explanation: q.explanation || null,
            alternatives: {
              create: q.alternatives.map((alt) => ({
                id: `${q.id}-${alt.id}`,
                letter: alt.letter,
                text: alt.text,
                isCorrect: alt.letter === q.correctAlternative,
              })),
            },
          },
        });
      }
      console.log(
        `🌱 Seeded tables: questoes & alternativas (${initialQuestions.length} questions)`
      );
    }

    // 4. Seed Default Exam
    const examCount = await prisma.exam.count();
    if (examCount === 0) {
      await prisma.exam.create({
        data: {
          id: 'exam-catolica-01',
          code: '#DIR-EMPRESARIAL-02',
          title: 'AVALIAÇÃO ESCRITA 02',
          subtitle: 'Semestre Letivo 2024.2',
          institution: 'Católica SC Centro Universitário',
          department: 'Escola de Direito',
          course: 'Direito',
          discipline:
            'Sociedades Empresariais e Direito de Reestruturação Empresarial',
          classGroup: 'Turma A',
          semester: '2024.2',
          date: '23/10/2024',
          duration: '3 horas',
          instructions: [
            'Sobre a mesa, o estudante deverá manter somente o material necessário para a realização da prova (caneta azul ou preta, lápis e borracha).',
            'Todos os celulares e aparelhos eletrônicos deverão ser desligados e guardados.',
            'A interpretação das questões faz parte integrante da avaliação.',
            'As questões objetivas devem ser assinaladas no gabarito oficial com preenchimento completo do círculo.',
            'Rasuras na folha de respostas anularão a questão.',
          ],
          includeBoxNota: true,
        },
      });
      console.log('🌱 Seeded table: provas');
    }

    // 5. Seed QR Codes
    const qrCount = await prisma.qrCode.count();
    if (qrCount === 0) {
      const mockQrRepo = new MockQrCodeRepository();
      const qrs = [
        ...(await mockQrRepo.listByApplication('app-cal-1')),
        ...(await mockQrRepo.listByApplication('app-dir-1')),
      ];
      for (const qr of qrs) {
        await prisma.qrCode.create({
          data: {
            id: qr.id,
            applicationId: qr.applicationId,
            examVersionId: qr.examVersionId,
            versionLetter: qr.versionLetter,
            examCode: qr.examCode,
            qrCodePayload: qr.qrCodePayload,
            publicCode: qr.publicCode,
            svgContent: qr.svgContent,
            dataUrl: qr.dataUrl,
            matrixDimension: qr.matrixDimension,
            checksum: qr.checksum,
          },
        });
      }
      console.log(`🌱 Seeded table: qr_codes (${qrs.length} records)`);
    }
  } catch (err: any) {
    console.error('⚠️ Seed warning:', err.message);
  }
}
