import { describe, it, expect, vi } from 'vitest';
import { resolveBundleContents } from '../src/utils/registry';
import type { RegistryItem } from '../src/utils/download';

describe('registry bundles', () => {
  it('returns non-bundle as-is', () => {
    const item: RegistryItem = { name: 'a', path: 'a', type: 'skill' };
    const result = resolveBundleContents([item], item);
    expect(result).toEqual({ valid: [item], missing: [] });
  });

  it('resolves bundles recursively and dedupes', () => {
    const a: RegistryItem = { name: 'a', path: 'a', type: 'skill' };
    const b: RegistryItem = { name: 'b', path: 'b', type: 'skill' };
    const c: RegistryItem = { name: 'c', path: 'c', type: 'skill' };
    const inner: RegistryItem = { name: 'inner', path: 'inner', type: 'bundle', includes: ['a', 'b'] };
    const outer: RegistryItem = { name: 'outer', path: 'outer', type: 'bundle', includes: ['inner', 'b', 'c'] };

    const registryItems = [a, b, c, inner, outer];
    const result = resolveBundleContents(registryItems, outer);

    expect(result.missing).toEqual([]);
    expect(result.valid.map(i => i.name).sort()).toEqual(['a', 'b', 'c'].sort());
  });

  it('reports missing items', () => {
    const a: RegistryItem = { name: 'a', path: 'a', type: 'skill' };
    const bundle: RegistryItem = { name: 'bundle', path: 'bundle', type: 'bundle', includes: ['a', 'missing'] };

    const result = resolveBundleContents([a, bundle], bundle);
    expect(result.valid.map(i => i.name)).toEqual(['a']);
    expect(result.missing).toEqual(['missing']);
  });

  it('handles circular bundles without infinite recursion', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const a: RegistryItem = { name: 'a', path: 'a', type: 'skill' };
    const bundleA: RegistryItem = { name: 'bundleA', path: 'bundleA', type: 'bundle', includes: ['bundleB', 'a'] };
    const bundleB: RegistryItem = { name: 'bundleB', path: 'bundleB', type: 'bundle', includes: ['bundleA'] };

    const result = resolveBundleContents([a, bundleA, bundleB], bundleA);
    expect(result.valid.map(i => i.name)).toEqual(['a']);
    expect(warnSpy.mock.calls.some(c => String(c.join(' ')).toLowerCase().includes('circular dependency'))).toBe(true);
    warnSpy.mockRestore();
  });
});
