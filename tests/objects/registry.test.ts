import { describe, expect, it } from 'vitest';
import type { ObjectKind } from '../../src/domain/types';
import { objectRegistry } from '../../src/objects/registry';
import { canvasObjectRenderers } from '../../src/objects/canvasRenderRegistry';

const kinds: ObjectKind[] = [
  'data-mask', 'alarm-mask', 'container', 'soft-key-mask', 'key', 'button', 'input-boolean', 'input-string', 'input-number', 'input-list', 'output-string', 'output-number',
  'output-line', 'output-polygon', 'output-ellipse', 'output-rectangle', 'output-meter', 'output-linear-bar-graph', 'output-arched-bar-graph', 'picture-graphic', 'font-attribute', 'line-attribute', 'fill-attribute',
  'string-variable', 'number-variable', 'object-pointer', 'macro',
];

describe('object registry', () => {
  it('contains every object kind', () => {
    expect(Object.keys(objectRegistry).sort()).toEqual([...kinds].sort());
  });

  it('contains canvas renderers for canvas-renderable child kinds', () => {
    expect(Object.keys(canvasObjectRenderers).sort()).toEqual([
      'alarm-mask', 'button', 'container', 'input-boolean', 'input-list', 'input-number', 'input-string', 'key', 'object-pointer', 'output-ellipse', 'output-line', 'output-meter', 'output-linear-bar-graph', 'output-arched-bar-graph', 'output-polygon', 'output-number', 'output-rectangle', 'output-string', 'picture-graphic',
    ].sort());
  });

  it('every module has writer, exportOrder, meta, createDefault, and Properties', () => {
    for (const kind of kinds) {
      const module = objectRegistry[kind];
      expect(typeof module.writer, `${kind} writer`).toBe('function');
      expect(Number.isInteger(module.exportOrder), `${kind} exportOrder`).toBe(true);
      expect(module.meta, `${kind} meta`).toBeDefined();
      expect(module.meta.name, `${kind} meta.name`).toBeTruthy();
      expect(typeof module.createDefault, `${kind} createDefault`).toBe('function');
      expect(module.Properties, `${kind} Properties`).toBeDefined();
    }
  });
});
