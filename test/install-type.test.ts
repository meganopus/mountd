import { describe, it, expect } from 'vitest';
import { isLegacyWorkflowRecord, normalizeInstallType } from '../src/utils/install-type';

describe('install-type', () => {
  it('normalizeInstallType defaults to skill', () => {
    expect(normalizeInstallType(undefined)).toEqual({ canonicalType: 'skill', wasDeprecated: false });
  });

  it('normalizeInstallType maps workflow -> skill and marks deprecated', () => {
    expect(normalizeInstallType('workflow')).toEqual({
      canonicalType: 'skill',
      legacyType: 'workflow',
      wasDeprecated: true,
      deprecatedReason: '`workflow` is deprecated and now installs as `skill`.',
    });
  });

  it('isLegacyWorkflowRecord detects legacy workflow via legacyType', () => {
    expect(isLegacyWorkflowRecord({ legacyType: 'workflow' })).toBe(true);
  });

  it('isLegacyWorkflowRecord detects legacy workflow via type', () => {
    expect(isLegacyWorkflowRecord({ type: 'workflow' })).toBe(true);
  });

  it('isLegacyWorkflowRecord is false for normal records', () => {
    expect(isLegacyWorkflowRecord({ type: 'skill' })).toBe(false);
    expect(isLegacyWorkflowRecord(undefined)).toBe(false);
  });
});
