import { describe, expect, it } from 'vitest';
import type { ObjectKind } from '../../src/domain/types';
import { canvasObjectRenderers } from '../../src/objects/canvasRenderRegistry';
import { extractedModules } from '../../src/objects/extractedModules';
import { metaRegistry } from '../../src/objects/metaRegistry';
import { objectPropertyComponents } from '../../src/objects/objectPropertyRegistry';
import { writerModules } from '../../src/objects/writerRegistry';

const kinds: ObjectKind[] = [
  'data-mask', 'container', 'soft-key-mask', 'key', 'button', 'input-boolean', 'input-string', 'output-string', 'output-number',
  'output-rectangle', 'picture-graphic', 'font-attribute', 'line-attribute', 'fill-attribute',
  'string-variable', 'number-variable',
];

describe('object registries', () => {
  it('contains every object kind in each registry', () => {
    expect(Object.keys(writerModules).sort()).toEqual([...kinds].sort());
    expect(Object.keys(extractedModules).sort()).toEqual([...kinds].sort());
    expect(Object.keys(metaRegistry).sort()).toEqual([...kinds].sort());
    expect(Object.keys(objectPropertyComponents).sort()).toEqual([...kinds].sort());
  });

  it('contains canvas renderers for canvas-renderable child kinds', () => {
    expect(Object.keys(canvasObjectRenderers).sort()).toEqual([
      'button', 'container', 'input-boolean', 'input-string', 'key', 'output-number', 'output-rectangle', 'output-string', 'picture-graphic',
    ].sort());
  });

  it('contains writer, export order, metadata, and default factory coverage', () => {
    for (const kind of kinds) {
      expect(typeof writerModules[kind].writer).toBe('function');
      expect(Number.isInteger(writerModules[kind].exportOrder)).toBe(true);
      expect(metaRegistry[kind]).toBe(extractedModules[kind].meta);
      expect(typeof extractedModules[kind].createDefault).toBe('function');
      expect(typeof objectPropertyComponents[kind]).toBe('function');
    }
  });
});
