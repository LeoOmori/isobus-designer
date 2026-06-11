import { OUTPUT_STRING_OPTION_TRANSPARENT, asHorizontalJustification, asVerticalJustification, clamp, nearestVtColorIndex } from '../../domain/isobus';
import type { CreateObjectContext } from '../ObjectModule';
import type { EditorObject } from '../../domain/types';
import { toObjectId } from '../createHelpers';

export function createDefaultOutputString({ current, x, y, parentId }: CreateObjectContext): EditorObject {
  const n = current.nextNumber;
  const activeParent = current.objects.find((o) => o.id === parentId)
    ?? current.objects.find((o) => o.id === current.activeMaskId)
    ?? { id: '', kind: 'data-mask', x: 0, y: 0, width: 480, height: 480 } as Pick<EditorObject, 'id' | 'kind' | 'x' | 'y' | 'width' | 'height'>;
  const defaultFont = current.objects.find((o) => o.kind === 'font-attribute');
  const isNestedParent = activeParent.kind === 'button' || activeParent.kind === 'container' || activeParent.kind === 'key';

  return {
    id: `STR_${n}`,
    objectId: toObjectId('output-string', current),
    name: `Output String ${n}`,
    kind: 'output-string',
    parentId: activeParent.id || undefined,
    visible: true,
    zIndex: current.objects.length + 1,

    x: isNestedParent ? x : clamp(x, 0, activeParent.width - 40),
    y: isNestedParent ? y : clamp(y, 0, activeParent.height - 30),
    width: 80,
    height: 30,

    backgroundColor: '#ffffff',
    backgroundColorIndex: 1,
    borderColor: '#dfe6f0',

    text: 'New Text',
    length: 32,
    fontAttributeId: defaultFont?.id ?? '',
    variableReference: null,
    outputOptions: 0,
    horizontalJustification: asHorizontalJustification(0),
    verticalJustification: asVerticalJustification(0),
  };
}

export function migrateOutputString(object: EditorObject): EditorObject {
  const backgroundColorIndex = object.backgroundColorIndex ?? backgroundColorToIndex(object.backgroundColor);
  const outputOptions = object.backgroundColor === 'transparent'
    ? (object.outputOptions ?? 0) | OUTPUT_STRING_OPTION_TRANSPARENT
    : object.outputOptions ?? 0;
  const text = object.text ?? '';
  const variableReference = object.variableReference !== undefined
    ? object.variableReference
    : object.stringVariableId ? object.stringVariableId : null;

  return {
    ...object,
    backgroundColorIndex,
    length: object.length ?? Math.max(32, text.length),
    variableReference,
    stringVariableId: undefined,
    outputOptions,
    horizontalJustification: object.horizontalJustification ?? horizontalAlignToJustification(object.horizontalAlign),
    verticalJustification: object.verticalJustification ?? verticalAlignToJustification(object.verticalAlign),
    horizontalAlign: undefined,
    verticalAlign: undefined,
  };
}

function backgroundColorToIndex(color: string | undefined) {
  if (!color || color === 'transparent') return 1;
  return nearestVtColorIndex(color);
}

function horizontalAlignToJustification(value: EditorObject['horizontalAlign']) {
  if (value === 'center') return asHorizontalJustification(1);
  if (value === 'right') return asHorizontalJustification(2);
  return asHorizontalJustification(0);
}

function verticalAlignToJustification(value: EditorObject['verticalAlign']) {
  if (value === 'center') return asVerticalJustification(1);
  if (value === 'bottom') return asVerticalJustification(2);
  return asVerticalJustification(0);
}
