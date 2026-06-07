import { describe, expect, it } from 'vitest';
import type { ObjectKind } from '../domain/types';
import { writerModules } from './writerRegistry';

describe('writerModules', () => {
  it('contains every object kind with a writer and export order', () => {
    const kinds: ObjectKind[] = [
      'data-mask', 'container', 'soft-key-mask', 'key', 'button', 'output-string', 'output-number',
      'output-rectangle', 'picture-graphic', 'font-attribute', 'line-attribute', 'fill-attribute',
      'string-variable', 'number-variable',
    ];

    expect(Object.keys(writerModules).sort()).toEqual([...kinds].sort());
    for (const kind of kinds) {
      expect(typeof writerModules[kind].writer).toBe('function');
      expect(Number.isInteger(writerModules[kind].exportOrder)).toBe(true);
    }
  });
});
