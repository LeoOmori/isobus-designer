import { describe, expect, it } from 'vitest';
import { OUTPUT_STRING_OPTION_AUTO_WRAP, OUTPUT_STRING_OPTION_TRANSPARENT, OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN } from '../../src/domain/isobus';
import type { EditorObject, ProjectState } from '../../src/domain/types';
import { canvasObjectFrameStyle, canvasObjectRenderers, isCanvasObjectRenderable, visibleChildObjects } from '../../src/objects/canvasRenderRegistry';

describe('canvas render registry', () => {
  it('covers all renderable canvas object kinds', () => {
    expect(Object.keys(canvasObjectRenderers).sort()).toEqual([
      'button', 'container', 'input-boolean', 'input-string', 'key', 'output-number', 'output-rectangle', 'output-string', 'picture-graphic',
    ].sort());
  });

  it('computes output-string frame style from object and font references', () => {
    const font = object({ id: 'FONT_1', kind: 'font-attribute', fontColor: 2, fontHeight: 24, fontStyle: 1 | 2 | 4, proportional: false });
    const output = object({
      id: 'STR_1', kind: 'output-string', fontAttributeId: font.id, backgroundColorIndex: 1,
      outputOptions: OUTPUT_STRING_OPTION_TRANSPARENT | OUTPUT_STRING_OPTION_AUTO_WRAP | OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN,
      horizontalJustification: 1, verticalJustification: 2,
    });
    const project = projectWith([font, output]);

    expect(canvasObjectFrameStyle(output, context(project))).toMatchObject({
      background: 'transparent',
      fontSize: 24,
      fontWeight: 700,
      fontStyle: 'italic',
      textDecoration: 'underline',
      justifyContent: 'center',
      alignItems: 'flex-end',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'break-word',
      hyphens: 'manual',
    });
  });

  it('filters hidden children and hidden containers', () => {
    const container = object({ id: 'CT_1', kind: 'container', childObjectIds: ['A', 'B', 'C'] });
    const a = object({ id: 'A', kind: 'output-string', zIndex: 3 });
    const b = object({ id: 'B', kind: 'output-string', zIndex: 1 });
    const c = object({ id: 'C', kind: 'output-string', zIndex: 2, visible: false });

    expect(visibleChildObjects(projectWith([container, a, b, c]), container).map((child) => child.id)).toEqual(['B', 'A']);
    expect(isCanvasObjectRenderable(container)).toBe(true);
    expect(isCanvasObjectRenderable({ ...container, hidden: true })).toBe(false);
  });
});

function object(changes: Partial<EditorObject> = {}): EditorObject {
  return {
    id: 'OBJ_1', objectId: '0x0201', name: 'Object 1', kind: 'output-string', visible: true,
    zIndex: 1, x: 0, y: 0, width: 100, height: 20, backgroundColor: '#ffffff', backgroundColorIndex: 1, borderColor: '#dfe6f0',
    ...changes,
  } as EditorObject;
}

function projectWith(objects: EditorObject[]): ProjectState {
  return { workingSet: { id: 'WS_1' }, activeMaskId: 'DM_1', nextNumber: 5, objects } as ProjectState;
}

function context(project: ProjectState) {
  return {
    project,
    objectById: new Map(project.objects.map((objectToMap) => [objectToMap.id, objectToMap])),
    editingTextObjectId: null,
    isSelected: false,
    clipDisabled: false,
    onPatch: () => undefined,
    onEndEditing: () => undefined,
    renderChildren: () => null,
  };
}
