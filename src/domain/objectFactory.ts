import { clamp } from './isobus';
import { objectKindName } from './objectMeta';
import type { EditorObject, ObjectKind, ProjectState, ReferenceKind } from './types';

export function toObjectId(n: number) {
  return `0x${(0x200 + n).toString(16).padStart(4, '0').toUpperCase()}`;
}

const KIND_PREFIX: Record<ObjectKind, string> = {
  'data-mask':        'DM',
  'soft-key-mask':    'SKM',
  'key':              'KEY',
  'button':           'BTN',
  'output-string':    'STR',
  'output-number':    'NUM',
  'output-rectangle': 'RECT',
  'picture-graphic':  'PIC',
  'font-attribute':   'FONT',
  'line-attribute':   'LA',
  'fill-attribute':   'FA',
  'string-variable':  'SV',
  'number-variable':  'NV',
};

/** Kinds that live outside the canvas layout (no x/y/w/h). */
const REFERENCE_KINDS = new Set<ObjectKind>([
  'line-attribute', 'fill-attribute', 'font-attribute', 'string-variable', 'number-variable',
]);

/** Kinds that are containers (top-level, not child of a data mask). */
const CONTAINER_KINDS = new Set<ObjectKind>(['data-mask', 'soft-key-mask']);

/** Kinds that are dropped directly onto a data-mask canvas. */
const CANVAS_OBJECT_KINDS = new Set<ObjectKind>([
  'output-string', 'output-number', 'output-rectangle', 'button', 'picture-graphic',
]);

export function createEditorObject(
  kind: ObjectKind,
  current: ProjectState,
  x = 70,
  y = 70,
  parentMaskId = current.activeMaskId,
): EditorObject {
  const n = current.nextNumber;
  const id = `${KIND_PREFIX[kind]}_${n}`;

  const activeMask = current.objects.find((o) => o.id === parentMaskId)
    ?? current.objects.find((o) => o.id === current.activeMaskId)!;

  const isRef       = REFERENCE_KINDS.has(kind);
  const isContainer = CONTAINER_KINDS.has(kind);
  const isCanvas    = CANVAS_OBJECT_KINDS.has(kind);
  const isKey       = kind === 'key';
  const isMask      = kind === 'data-mask';
  const isSKM       = kind === 'soft-key-mask';

  // Objects with no spatial layout: reference-only and soft-key-mask
  const noLayout = isRef || isSKM || isKey;

  // Find shared attribute defaults
  const defaultFont = current.objects.find((o) => o.kind === 'font-attribute');
  const defaultLine = current.objects.find((o) => o.kind === 'line-attribute');
  const defaultFill = current.objects.find((o) => o.kind === 'fill-attribute');

  const obj: EditorObject = {
    // Core
    id,
    objectId: toObjectId(n),
    name: `${objectKindName(kind)} ${n}`,
    kind,
    parentId: isCanvas ? activeMask.id : undefined,
    visible: true,
    locked: isContainer ? false : undefined,
    zIndex: current.objects.length + 1,

    // Layout
    x:      noLayout ? 0 : isMask  ? activeMask.x + 80 : clamp(x, 0, activeMask.width  - 40),
    y:      noLayout ? 0 : isMask  ? activeMask.y + 80 : clamp(y, 0, activeMask.height - 30),
    width:  noLayout ? 0 : isMask  ? 480
          : kind === 'output-string' || kind === 'output-number' ? 220
          : kind === 'button'  ? 120
          : kind === 'picture-graphic' ? 64
          : 130,
    height: noLayout ? 0 : isMask  ? 480
          : kind === 'output-string' || kind === 'output-number' ? 42
          : kind === 'button'  ? 42
          : kind === 'picture-graphic' ? 64
          : 90,

    // Editor colors
    backgroundColor: isRef || isSKM || isKey ? 'transparent' : '#ffffff',
    borderColor:     isRef ? 'transparent' : '#dfe6f0',

    // Container children
    childObjectIds: (isMask || isKey || kind === 'button') ? [] : undefined,

    // ── Data Mask ───────────────────────────────────────────────────────
    softKeyMaskId:  isMask ? '' : undefined,
    nextMaskId:     isMask ? '' : undefined,
    previousMaskId: isMask ? '' : undefined,

    // ── Soft Key Mask ────────────────────────────────────────────────────
    keys:                isSKM ? [] : undefined,
    layoutPreview:       isSKM ? 'vertical' : undefined,
    softKeyCountPreview: isSKM ? 6 : undefined,

    // ── Key ─────────────────────────────────────────────────────────────
    label:      isKey ? 'Key' : undefined,
    actionName: isKey ? '' : undefined,

    // ── Button ───────────────────────────────────────────────────────────
    keyCode:       kind === 'button' || isKey ? 0 : undefined,
    buttonOptions: kind === 'button' ? 1 : undefined, // bit0 = border on
    enabled:       kind === 'button' ? true : undefined,

    // ── Output String ────────────────────────────────────────────────────
    text:            kind === 'output-string' ? 'New Text' : undefined,
    fontAttributeId: (kind === 'output-string' || kind === 'output-number') ? (defaultFont?.id ?? '') : undefined,
    stringVariableId: kind === 'output-string' ? '' : undefined,
    outputOptions:   (kind === 'output-string' || kind === 'output-number') ? 0 : undefined,
    horizontalAlign: kind === 'output-string' ? 'left' : undefined,
    verticalAlign:   kind === 'output-string' ? 'top'  : undefined,
    fontSize: kind === 'font-attribute' ? 24 : kind === 'output-string' ? 22 : undefined,

    // ── Output Number ────────────────────────────────────────────────────
    numberVariableId: kind === 'output-number' ? '' : undefined,
    offset:           kind === 'output-number' ? 0  : undefined,
    scale:            kind === 'output-number' ? 1  : undefined,
    numberOfDecimals: kind === 'output-number' ? 0  : undefined,
    numberFormat:     kind === 'output-number' ? 0  : undefined,
    value:            (kind === 'output-number' || kind === 'number-variable') ? 0 : undefined,

    // ── Output Rectangle ─────────────────────────────────────────────────
    lineAttributeId:  kind === 'output-rectangle' ? (defaultLine?.id ?? '') : undefined,
    fillAttributeId:  kind === 'output-rectangle' ? (defaultFill?.id ?? '') : undefined,
    lineSuppression:  kind === 'output-rectangle' ? 0 : undefined,
    hidden:           kind === 'output-rectangle' ? false : undefined,

    // ── Picture Graphic ──────────────────────────────────────────────────
    actualWidth:      kind === 'picture-graphic' ? 64  : undefined,
    actualHeight:     kind === 'picture-graphic' ? 64  : undefined,
    graphicFormat:    kind === 'picture-graphic' ? 0   : undefined,
    graphicOptions:   kind === 'picture-graphic' ? 0   : undefined,
    transparencyColor: kind === 'picture-graphic' ? 0  : undefined,
    rawData:          kind === 'picture-graphic' ? []  : undefined,

    // ── Font Attribute ────────────────────────────────────────────────────
    fontColor:   kind === 'font-attribute' ? 0    : undefined,
    proportional: kind === 'font-attribute' ? true : undefined,
    fontWidth:   kind === 'font-attribute' ? 16   : undefined,
    fontHeight:  kind === 'font-attribute' ? 24   : undefined,
    fontType:    kind === 'font-attribute' ? 1    : undefined,
    fontStyle:   kind === 'font-attribute' ? 0    : undefined,

    // ── Line Attribute ────────────────────────────────────────────────────
    lineColor: kind === 'line-attribute' ? 0        : undefined,
    lineWidth: kind === 'line-attribute' ? 1        : undefined,
    lineArt:   kind === 'line-attribute' ? '0xFFFF' : undefined,

    // ── Fill Attribute ────────────────────────────────────────────────────
    fillType:  kind === 'fill-attribute' ? 2  : undefined, // 2 = fill-color (ISO)
    fillColor: kind === 'fill-attribute' ? 15 : undefined, // white

    // ── String Variable ───────────────────────────────────────────────────
    stringValue: kind === 'string-variable' ? 'Dynamic text' : undefined,
    maxLength:   kind === 'string-variable' ? 128 : undefined,

    // ── Number Variable ───────────────────────────────────────────────────
    unit: kind === 'number-variable' ? '' : undefined,
  };

  return obj;
}

export function referencePatch(kind: ReferenceKind, id: string): Partial<EditorObject> {
  switch (kind) {
    case 'line-attribute':  return { lineAttributeId: id };
    case 'fill-attribute':  return { fillAttributeId: id };
    case 'font-attribute':  return { fontAttributeId: id };
    case 'string-variable': return { stringVariableId: id };
    case 'number-variable': return { numberVariableId: id };
  }
}
