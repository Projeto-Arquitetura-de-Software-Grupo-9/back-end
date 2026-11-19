import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TestSettingsRepository } from '../helpers/inMemoryRepositories';
import { SettingsService } from '../../src/services/SettingsService';

describe('SettingsService Unit Tests (System Preferences & LGPD Coverage)', () => {
  it('should retrieve default settings, validate boundaries, update thresholds, reset, and anonymize', async () => {
    const repo = new TestSettingsRepository();
    const service = new SettingsService(repo);

    const settings = await service.getSettings('teacher-1');
    assert.equal(settings.institutionName, 'CATÓLICA DE SANTA CATARINA');
    assert.equal(settings.passingGrade, 7.0);

    await assert.rejects(
      () => service.updateSettings('teacher-1', { passingGrade: -1 as any }),
      /entre 0.0 e 10.0/
    );
    await assert.rejects(
      () => service.updateSettings('teacher-1', { passingGrade: 11 as any }),
      /entre 0.0 e 10.0/
    );
    await assert.rejects(
      () => service.updateSettings('teacher-1', { professorEmail: 'invalido' }),
      /e-mail institucional válido/
    );

    const media = await service.updateSettings('teacher-1', {
      omrSensitivity: 'Média (Threshold 0.50)',
      passingGrade: 6.5,
    });
    assert.equal(media.omrThreshold, 0.5);
    assert.equal(media.passingGrade, 6.5);

    const rigorosa = await service.updateSettings('teacher-1', {
      omrSensitivity: 'Rigorosa (Threshold 0.80)',
    });
    assert.equal(rigorosa.omrThreshold, 0.8);

    const reset = await service.resetSettings('teacher-1');
    assert.equal(reset.passingGrade, 7.0);

    const anon = await service.anonymizeTeacher('teacher-1');
    assert.equal(anon.professorName, 'Usuário Removido');
    assert.ok(anon.professorEmail.startsWith('anon-'));
  });
});
