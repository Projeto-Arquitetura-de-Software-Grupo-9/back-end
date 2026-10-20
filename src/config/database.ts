import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { MockStudentRepository } from '../repositories/mock/MockStudentRepository';
import { MockQuestionRepository } from '../repositories/mock/MockQuestionRepository';
import { MockQrCodeRepository } from '../repositories/mock/MockQrCodeRepository';
import { PrismaTiDBHttpAdapterFactory, TiDBHttpConfig } from './tidbHttpAdapter';

dotenv.config();

function parseTiDBConfig(): TiDBHttpConfig | null {
  let host = process.env.DB_HOST || '';
  let user = process.env.DB_USER || '';
  let password = process.env.DB_PASSWORD || '';
  let database = process.env.DB_NAME || '';

  const rawUrl = process.env.DATABASE_URL || '';
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      if (!host) host = parsed.hostname;
      if (!user) user = decodeURIComponent(parsed.username);
      if (!password) password = decodeURIComponent(parsed.password);
      if (!database) database = parsed.pathname.replace(/^\//, '');
    } catch {
      // Fallback to DB_* env vars
    }
  }

  if (host.includes('tidbcloud.com') && user && password) {
    return {
      host,
      user,
      password,
      database: database || 'sgp_catolica',
    };
  }

  return null;
}

function buildDatabaseUrl(): string {
  const host = process.env.DB_HOST || 'gateway01.ap-northeast-1.prod.aws.tidbcloud.com';
  const port = process.env.DB_PORT || '4000';
  const user = process.env.DB_USER || '3SU7yETPYeXcU97.root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'sgp_catolica';

  let url =
    process.env.DATABASE_URL ||
    `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${dbName}`;

  const isTiDB = url.includes('tidbcloud.com') || host.includes('tidbcloud.com');
  if (isTiDB && !url.includes('sslaccept=')) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}sslcert=./isrgrootx1.pem&sslaccept=strict`;
  }

  return url;
}

export const databaseUrl = buildDatabaseUrl();
const tidbConfig = parseTiDBConfig();
const logLevels: ('warn' | 'error')[] =
  process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'];

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ||
  (tidbConfig
    ? new PrismaClient({
        adapter: new PrismaTiDBHttpAdapterFactory(tidbConfig),
        log: logLevels,
      } as any)
    : new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl,
          },
        },
        log: logLevels,
      }));

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
    await prisma.$queryRaw`SELECT 1`;
    const host = process.env.DB_HOST || 'MySQL';
    const db = process.env.DB_NAME || 'sgp_catolica';
    console.log(`✅ Connected to database: ${db} (${host})`);
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

    // 2. Seed Professors
    const professorCount = await prisma.professor.count();
    if (professorCount === 0) {
      await prisma.professor.createMany({
        data: [
          {
            id: 'prof-catolica-01',
            nomeCompleto: 'Prof. Carlos Eduardo Mendes',
            email: 'carlos.mendes@catolicasc.edu.br',
            senhaHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
          },
          {
            id: 'usr-prof-1',
            nomeCompleto: 'Prof. Dra. Maria Helena Diniz',
            email: 'prof.helena@catolica.edu.br',
            senhaHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
          },
        ],
      });
      console.log('🌱 Seeded table: professores');
    }

    // 3. Seed Disciplinas
    const disciplinaCount = await prisma.disciplina.count();
    if (disciplinaCount === 0) {
      await prisma.disciplina.createMany({
        data: [
          {
            id: 'disc-1',
            idProfessor: 'prof-catolica-01',
            codigo: 'DIR-101',
            nome: 'Direito Constitucional I',
            curso: 'Direito',
          },
          {
            id: 'disc-2',
            idProfessor: 'prof-catolica-01',
            codigo: 'MAT-201',
            nome: 'Cálculo Diferencial e Integral I',
            curso: 'Engenharia de Software',
          },
          {
            id: 'disc-3',
            idProfessor: 'prof-catolica-01',
            codigo: 'CC-102',
            nome: 'Algoritmos e Estruturas de Dados',
            curso: 'Sistemas de Informação',
          },
          {
            id: 'disc-4',
            idProfessor: 'prof-catolica-01',
            codigo: 'DIR-302',
            nome: 'Sociedades Empresariais e Direito de Reestruturação',
            curso: 'Direito',
          },
        ],
      });
      console.log('🌱 Seeded table: disciplinas');
    }

    // 4. Seed Turmas
    const turmaCount = await prisma.turma.count();
    if (turmaCount === 0) {
      await prisma.turma.createMany({
        data: [
          {
            id: 'class-1',
            idProfessor: 'prof-catolica-01',
            idDisciplina: 'disc-1',
            nome: 'Turma A - Matutino',
            periodoLetivo: '2026.1',
            status: 'ativa',
          },
          {
            id: 'class-2',
            idProfessor: 'prof-catolica-01',
            idDisciplina: 'disc-1',
            nome: 'Turma B - Noturno',
            periodoLetivo: '2026.1',
            status: 'ativa',
          },
          {
            id: 'class-3',
            idProfessor: 'prof-catolica-01',
            idDisciplina: 'disc-2',
            nome: 'Turma Única - Integral',
            periodoLetivo: '2026.1',
            status: 'ativa',
          },
        ],
      });
      console.log('🌱 Seeded table: turmas');
    }

    // 5. Seed Students
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
