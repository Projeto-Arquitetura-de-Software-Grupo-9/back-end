import dotenv from 'dotenv';
dotenv.config();

import { createApp } from '../src/app';
import { repositories, getActiveDataSource } from '../src/repositories';

async function verify() {
  console.log('🔍 Iniciando verificação de ponta a ponta com o banco de dados TiDB Cloud...');
  console.log(`📌 Fonte de dados ativa: ${getActiveDataSource()}`);

  // 1. Settings Repository
  console.log('\n--- 1. Settings ---');
  const settings = await repositories.settings.getSettings('usr-prof-1');
  console.log('✅ Settings carregadas:', {
    institutionName: settings.institutionName,
    professorName: settings.professorName,
    passingGrade: settings.passingGrade,
  });

  // 2. Students Repository
  console.log('\n--- 2. Students ---');
  const students = await repositories.student.findAll();
  console.log(`✅ Total de alunos retornados: ${students.length}`);
  if (students.length > 0) {
    console.log('Exemplo aluno:', {
      nome: students[0].name,
      matricula: students[0].registration,
      curso: students[0].course,
      status: students[0].status,
    });
  }

  // 3. Questions Repository
  console.log('\n--- 3. Questions ---');
  const questions = await repositories.question.findAll();
  console.log(`✅ Total de questões retornadas: ${questions.length}`);
  if (questions.length > 0) {
    console.log('Exemplo questão:', {
      code: questions[0].code,
      disciplina: questions[0].discipline,
      dificuldade: questions[0].difficulty,
      alternativas: questions[0].alternatives.length,
      correta: questions[0].correctAlternative,
    });
  }

  // 4. Disciplinas Repository
  console.log('\n--- 4. Disciplinas ---');
  const disciplinas = await repositories.disciplina.list();
  console.log(`✅ Total de disciplinas retornadas: ${disciplinas.length}`);
  disciplinas.forEach((d) => console.log(`   - [${d.codigo}] ${d.nome} (${d.curso})`));

  // 5. Turmas Repository
  console.log('\n--- 5. Turmas ---');
  const turmas = await repositories.turma.list();
  console.log(`✅ Total de turmas retornadas: ${turmas.length}`);
  turmas.forEach((t) => console.log(`   - ${t.nome} (${t.periodoLetivo}) - Disciplina: ${t.disciplina?.nome}`));

  // 6. QR Codes Repository
  console.log('\n--- 6. QR Codes ---');
  const qrs = await repositories.qrCode.listByApplication('app-cal-1');
  console.log(`✅ Total de QR Codes para app-cal-1: ${qrs.length}`);

  console.log('\n🎉 TODAS AS OPERAÇÕES NO BANCO DE DADOS TIDB CLOUD FORAM EXECUTADAS COM SUCESSO!');
}

verify()
  .catch((err) => {
    console.error('❌ Erro na verificação:', err);
    process.exit(1);
  });
