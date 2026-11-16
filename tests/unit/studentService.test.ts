import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { MockStudentRepository } from '../../src/repositories/mock/MockStudentRepository';
import { StudentService } from '../../src/services/StudentService';

describe('StudentService Unit Tests (Full Business Logic & Excel Coverage)', () => {
  it('should list students without filters and with filters', async () => {
    const repo = new MockStudentRepository();
    const service = new StudentService(repo);

    const all = await service.listStudents();
    assert.ok(all.length >= 5, 'Should return at least 5 default mock students');

    const filteredByDiscipline = await service.listStudents({ discipline: 'Direito Constitucional' });
    assert.ok(filteredByDiscipline.length > 0);
    filteredByDiscipline.forEach((s) => assert.equal(s.discipline, 'Direito Constitucional'));

    const filteredByClass = await service.listStudents({ classGroup: 'Turma A' });
    assert.ok(filteredByClass.length > 0);
    filteredByClass.forEach((s) => assert.equal(s.classGroup, 'Turma A'));

    const filteredBySearch = await service.listStudents({ search: 'Dolores' });
    assert.equal(filteredBySearch.length, 1);
    assert.equal(filteredBySearch[0].name, 'Amanda Dolores');
  });

  it('should get student by id and throw if not found', async () => {
    const repo = new MockStudentRepository();
    const service = new StudentService(repo);

    const student = await service.getStudentById('std-1');
    assert.equal(student.id, 'std-1');
    assert.equal(student.name, 'Amanda Dolores');

    await assert.rejects(
      () => service.getStudentById('non-existent-id'),
      /Student with id "non-existent-id" not found/
    );
  });

  it('should validate mandatory fields when creating a student', async () => {
    const repo = new MockStudentRepository();
    const service = new StudentService(repo);

    await assert.rejects(
      () => service.createStudent({ name: '', registration: '123', email: 'a@b.com' }),
      /O nome completo do aluno é obrigatório/
    );

    await assert.rejects(
      () => service.createStudent({ name: 'Carlos', registration: '', email: 'a@b.com' }),
      /A matrícula do aluno é obrigatória/
    );

    await assert.rejects(
      () => service.createStudent({ name: 'Carlos', registration: '123', email: '  ' }),
      /O e-mail do aluno é obrigatório/
    );

    const created = await service.createStudent({
      name: 'Novo Estudante',
      registration: '2026.1.999',
      email: 'novo.estudante@catolicasc.edu.br',
      course: 'Direito',
      classGroup: 'Turma C',
      discipline: 'Direito Tributário',
    });

    assert.ok(created.id.length > 0);
    assert.equal(created.name, 'Novo Estudante');
    assert.equal(created.examsTaken, 0);
  });

  it('should update student and throw if not found', async () => {
    const repo = new MockStudentRepository();
    const service = new StudentService(repo);

    const updated = await service.updateStudent('std-1', {
      name: 'Amanda Dolores Atualizada',
      overallAverage: 9.8,
    });
    assert.equal(updated.name, 'Amanda Dolores Atualizada');
    assert.equal(updated.overallAverage, 9.8);

    await assert.rejects(
      () => service.updateStudent('non-existent-id', { name: 'Teste' }),
      /Student with id "non-existent-id" not found/
    );
  });

  it('should delete student and throw if not found', async () => {
    const repo = new MockStudentRepository();
    const service = new StudentService(repo);

    await service.deleteStudent('std-1');
    await assert.rejects(
      () => service.getStudentById('std-1'),
      /Student with id "std-1" not found/
    );

    await assert.rejects(
      () => service.deleteStudent('non-existent-id'),
      /Student with id "non-existent-id" not found/
    );
  });

  it('should delete batch of students and validate input', async () => {
    const repo = new MockStudentRepository();
    const service = new StudentService(repo);

    await assert.rejects(
      () => service.deleteStudentsBatch([]),
      /Informe ao menos um ID de aluno para exclusão em massa/
    );

    const result = await service.deleteStudentsBatch(['std-2', 'std-3']);
    assert.equal(result.deletedCount, 2);

    await assert.rejects(
      () => service.getStudentById('std-2'),
      /Student with id "std-2" not found/
    );
  });

  it('should import students from JSON with duplicate detection', async () => {
    const repo = new MockStudentRepository();
    const service = new StudentService(repo);

    await assert.rejects(
      () => service.importStudents([]),
      /Nenhum registro de aluno fornecido para importação/
    );

    const batch = [
      {
        name: 'Aluno Importado 1',
        registration: '2026.1.1001',
        email: 'aluno1@catolicasc.edu.br',
      },
      {
        name: 'Aluno Importado 2',
        registration: '2026.1.1002',
        email: 'aluno2@catolicasc.edu.br',
      },
      {
        name: 'Aluno Duplicado',
        registration: '2024.1.001', // Already belongs to std-1 in mock repo
        email: 'duplicado@catolicasc.edu.br',
      },
      {
        name: 'Aluno Repetido no lote',
        registration: '2026.1.1001', // Repeated in same batch
        email: 'repetido@catolicasc.edu.br',
      },
    ];

    const result = await service.importStudents(batch);
    assert.equal(result.totalStudents, repo['students'].length);
    assert.equal(result.importedCount, 2);
    assert.equal(result.skippedCount, 2);
    assert.equal(result.errors.length, 2);
    assert.ok(result.errors.some((e) => e.registration === '2024.1.001'));
    assert.ok(result.errors.some((e) => e.reason.includes('já cadastrada')));
  });

  it('should import students from real Excel XLSX buffer', async () => {
    const repo = new MockStudentRepository();
    const service = new StudentService(repo);

    // 1. Test corrupted buffer error
    await assert.rejects(
      () => service.importStudentsFromExcelBuffer(Buffer.from('not an excel file')),
      /Arquivo inválido ou corrompido/
    );

    // 2. Build valid Excel in memory using ExcelJS
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Alunos');
    sheet.addRow(['Nome Completo', 'Matrícula', 'Curso', 'E-mail', 'Turma', 'Disciplina', 'Provas Realizadas', 'Média Geral']);
    sheet.addRow(['Carlos Silva', '2026.1.701', 'Direito', 'carlos.silva@catolicasc.edu.br', 'Turma A', 'Direito Constitucional', '3', '8,5']);
    sheet.addRow(['Beatriz Lima', '2026.1.702', 'Direito', '', 'Turma B', 'Direito Penal', '2', '9.0']); // Empty email should be autogenerated
    sheet.addRow(['', '']); // Empty row should be skipped silently
    sheet.addRow(['Dado Invalido', '2026.1.703', 'Direito', 'dado@catolicasc.edu.br', 'Turma A', 'Direito', 'invalid_number', '10']); // Non-numeric

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const result = await service.importStudentsFromExcelBuffer(buffer);

    assert.equal(result.importedCount, 2);
    assert.equal(result.skippedCount, 1); // 1 error row
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].row, 5);
    assert.ok(result.errors[0].reason.includes('devem ser números'));

    // Verify auto-generated email for Beatriz Lima
    const beatriz = await repo.findByRegistration('2026.1.702');
    assert.ok(beatriz);
    assert.equal(beatriz?.email, 'beatriz.lima@catolicasc.edu.br');
  });

  it('should build import template buffer and export students to Excel', async () => {
    const repo = new MockStudentRepository();
    const service = new StudentService(repo);

    const templateBuf = await service.buildImportTemplateBuffer();
    assert.ok(Buffer.isBuffer(templateBuf));
    assert.ok(templateBuf.length > 1000);

    const templateBook = new ExcelJS.Workbook();
    await templateBook.xlsx.load(templateBuf as any);
    const templateSheet = templateBook.worksheets[0];
    assert.ok(templateSheet);
    assert.equal(templateSheet.getRow(1).getCell(1).value, 'Nome Completo');

    const exportBuf = await service.exportStudentsToExcelBuffer({ discipline: 'Direito Constitucional' });
    assert.ok(Buffer.isBuffer(exportBuf));
    assert.ok(exportBuf.length > 1000);

    const exportBook = new ExcelJS.Workbook();
    await exportBook.xlsx.load(exportBuf as any);
    const exportSheet = exportBook.worksheets[0];
    assert.ok(exportSheet.rowCount >= 2);
  });

  it('should list distinct disciplines from students', async () => {
    const repo = new MockStudentRepository();
    const service = new StudentService(repo);

    const disciplines = await service.getDisciplines();
    assert.ok(Array.isArray(disciplines));
    assert.ok(disciplines.includes('Direito Constitucional'));
    assert.ok(disciplines.includes('Direito Penal'));
  });
});
