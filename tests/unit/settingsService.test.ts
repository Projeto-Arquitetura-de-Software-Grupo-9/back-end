import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MockSettingsRepository } from '../../src/repositories/mock/MockSettingsRepository';
import { SettingsService } from '../../src/services/SettingsService';

describe('SettingsService Unit Tests (System Preferences & LGPD Coverage)', () => {
  it('should retrieve existing or default settings for teacher', async () => {
    const repo = new MockSettingsRepository();
    const service = new SettingsService(repo);

    const settings = await service.getSettings('usr-prof-1');
    assert.equal(settings.teacherId, 'usr-prof-1');
    assert.equal(settings.institutionName, 'CATÓLICA DE SANTA CATARINA');
    assert.equal(settings.passingGrade, 7.0);

    // Query for a new teacher initializes fresh default settings
    const newSettings = await service.getSettings('teacher-new-42');
    assert.equal(newSettings.teacherId, 'teacher-new-42');
    assert.equal(newSettings.institutionName, 'CATÓLICA DE SANTA CATARINA');
  });

  it('should validate passing grade boundaries and email format', async () => {
    const repo = new MockSettingsRepository();
    const service = new SettingsService(repo);

    // Invalid negative grade
    await assert.rejects(
      () => service.updateSettings('usr-prof-1', { passingGrade: -1 as any }),
      /A nota mínima para aprovação deve ser um valor entre 0.0 e 10.0/
    );

    // Invalid grade > 10
    await assert.rejects(
      () => service.updateSettings('usr-prof-1', { passingGrade: 11 as any }),
      /A nota mínima para aprovação deve ser um valor entre 0.0 e 10.0/
    );

    // Invalid non-numeric grade
    await assert.rejects(
      () => service.updateSettings('usr-prof-1', { passingGrade: 'dez' as any }),
      /A nota mínima para aprovação deve ser um valor entre 0.0 e 10.0/
    );

    // Invalid email without @
    await assert.rejects(
      () => service.updateSettings('usr-prof-1', { professorEmail: 'invalido.email' }),
      /Informe um e-mail institucional válido/
    );
  });

  it('should resolve OMR thresholds and update system preferences', async () => {
    const repo = new MockSettingsRepository();
    const service = new SettingsService(repo);

    // Test 'Média (Threshold 0.50)'
    const updatedMedia = await service.updateSettings('usr-prof-1', {
      omrSensitivity: 'Média (Threshold 0.50)',
      passingGrade: 6.5,
    });
    assert.equal(updatedMedia.omrThreshold, 0.5);
    assert.equal(updatedMedia.passingGrade, 6.5);

    // Test 'Rigorosa (Threshold 0.80)'
    const updatedRigorosa = await service.updateSettings('usr-prof-1', {
      omrSensitivity: 'Rigorosa (Threshold 0.80)',
    });
    assert.equal(updatedRigorosa.omrThreshold, 0.8);

    // Test 'Alta (Threshold 0.65)'
    const updatedAlta = await service.updateSettings('usr-prof-1', {
      omrSensitivity: 'Alta (Threshold 0.65)',
    });
    assert.equal(updatedAlta.omrThreshold, 0.65);
  });

  it('should reset settings to default institutional values', async () => {
    const repo = new MockSettingsRepository();
    const service = new SettingsService(repo);

    // First change some values
    await service.updateSettings('usr-prof-1', {
      institutionName: 'Outra Faculdade',
      passingGrade: 5.0,
    });

    // Now reset
    const reset = await service.resetSettings('usr-prof-1');
    assert.equal(reset.institutionName, 'CATÓLICA DE SANTA CATARINA');
    assert.equal(reset.passingGrade, 7.0);
  });

  it('should anonymize teacher information for LGPD compliance', async () => {
    const repo = new MockSettingsRepository();
    const service = new SettingsService(repo);

    const anon = await service.anonymizeTeacher('usr-prof-1');
    assert.equal(anon.teacherId, 'usr-prof-1');
    assert.equal(anon.professorName, 'Usuário Anonimizado (LGPD)');
    assert.ok(anon.professorEmail.startsWith('anonimo.'));
    assert.ok(anon.anonymizedAt);
  });
});
