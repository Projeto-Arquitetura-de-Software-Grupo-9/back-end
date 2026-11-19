import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { TestStudentRepository } from '../helpers/inMemoryRepositories';
import { StudentService } from '../../src/services/StudentService';
import { StudentDTO } from '../../src/types/student.dto';

function makeSeedStudents(): StudentDTO[] {
  return [
    {
      id: 'std-1',
      name: 'Estudante Alfa',
      registration: '2026.1.001',
      course: 'Direito',
      email: 'alfa@catolicasc.edu.br',
      classGroup: 'Turma A',
      discipline: 'Direito Constitucional',
      examsTaken: 2,
      overallAverage: 8.5,
      status: 'approved',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'std-2',
      name: 'Estudante Beta',
      registration: '2026.1.002',
      course: 'Direito',
      email: 'beta@catolicasc.edu.br',
      classGroup: 'Turma B',
      discipline: 'Direito Penal',
      examsTaken: 1,
      overallAverage: 6.0,
      status: 'warning',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'std-3',
      name: 'Estudante Gama',
      registration: '2026.1.003',
      course: 'Engenharia',
      email: 'gama@catolicasc.edu.br',
      classGroup: 'Turma A',
      discipline: 'Direito Constitucional',
      examsTaken: 1,
      overallAverage: 4.5,
      status: 'failed',
      createdAt: new Date().toISOString(),
    },
  ];
}

describe('StudentService Unit Tests (Full Business Logic & Excel Coverage)', () => {
  it('should filter, create, update, delete, batch-delete, and import/export Excel cleanly', async () => {
    const repo = new TestStudentRepository(makeSeedStudents());
    const service = new StudentService(repo);

    assert.equal((await service.listStudents()).length, 3);
    assert.equal((await service.listStudents({ discipline: 'Direito Constitucional' })).length, 2);
    assert.equal((await service.listStudents({ search: 'Alfa' })).length, 1);

    await assert.rejects(() => service.getStudentById('missing'), /not found/);

    const created = await service.createStudent({
      name: 'Novo Estudante',
      registration: '2026.1.999',
      email: 'novo@catolicasc.edu.br',
      course: 'Direito',
      classGroup: 'Turma C',
      discipline: 'Direito Tributário',
    });
    assert.equal(created.name, 'Novo Estudante');

    const updated = await service.updateStudent('std-1', { overallAverage: 9.8 });
    assert.equal(updated.overallAverage, 9.8);

    const batchRes = await service.importStudents([
      { name: 'Imp 1', registration: '2026.1.501', email: 'imp1@catolicasc.edu.br' },
      { name: 'Dup 1', registration: '2026.1.001', email: 'dup@catolicasc.edu.br' },
    ]);
    assert.equal(batchRes.importedCount, 1);
    assert.equal(batchRes.skippedCount, 1);

    // Excel import & export
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Alunos');
    sheet.addRow(['Nome Completo', 'Matrícula', 'Curso', 'E-mail', 'Turma', 'Disciplina', 'Provas Realizadas', 'Média Geral']);
    sheet.addRow(['Estudante Planilha', '2026.1.701', 'Direito', '', 'Turma A', 'Direito Constitucional', '3', '8,5']);
    const buf = Buffer.from(await workbook.xlsx.writeBuffer());
    const excelRes = await service.importStudentsFromExcelBuffer(buf);
    assert.equal(excelRes.importedCount, 1);

    const templateBuf = await service.buildImportTemplateBuffer();
    assert.ok(Buffer.isBuffer(templateBuf) && templateBuf.length > 500);

    const exportBuf = await service.exportStudentsToExcelBuffer({ discipline: 'Direito Constitucional' });
    assert.ok(Buffer.isBuffer(exportBuf) && exportBuf.length > 500);

    const delRes = await service.deleteStudentsBatch(['std-2', 'std-3']);
    assert.equal(delRes.deletedCount, 2);
  });
});
