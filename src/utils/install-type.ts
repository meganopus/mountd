export type InstallType = 'skill' | 'workflow';

export interface NormalizedInstallType {
    canonicalType: 'skill';
    legacyType?: 'workflow';
    wasDeprecated: boolean;
    deprecatedReason?: string;
}

export function normalizeInstallType(type?: InstallType): NormalizedInstallType {
    if (type === 'workflow') {
        return {
            canonicalType: 'skill',
            legacyType: 'workflow',
            wasDeprecated: true,
            deprecatedReason: '`workflow` is deprecated and now installs as `skill`.'
        };
    }

    return {
        canonicalType: 'skill',
        wasDeprecated: false
    };
}

export function isLegacyWorkflowRecord(record?: { type?: string; legacyType?: string }): boolean {
    return record?.legacyType === 'workflow' || record?.type === 'workflow';
}
