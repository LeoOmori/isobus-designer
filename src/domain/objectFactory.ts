import { clamp } from './isobus';
import { objectKindName } from './objectMeta';
import type { EditorObject, ObjectKind, ProjectState, ReferenceKind } from './types';

export function toObjectId(n: number) {
  return `0x${(0x200 + n).toString(16).padStart(4, '0').toUpperCase()}`;
}

export function createEditorObject(kind: ObjectKind, current: ProjectState, x = 70, y = 70, parentMaskId = current.activeMaskId): EditorObject {
  const n = current.nextNumber;
  const activeMask = current.objects.find((object) => object.id === parentMaskId) ?? current.objects.find((object) => object.id === current.activeMaskId)!;
  const isMask = kind === 'data-mask';
  const isAttribute = kind === 'line-attribute' || kind === 'fill-attribute' || kind === 'font-attribute' || kind === 'string-variable';
  const prefix = kind === 'data-mask' ? 'DM' : kind === 'output-string' ? 'STR' : kind === 'rectangle' ? 'RECT' : kind === 'line-attribute' ? 'LA' : kind === 'fill-attribute' ? 'FA' : kind === 'font-attribute' ? 'FONT' : 'SV';
  const id = `${prefix}_${n}`;

  return {
    id,
    objectId: toObjectId(n),
    name: `${objectKindName(kind)} ${n}`,
    kind,
    parentId: isMask || isAttribute ? undefined : activeMask.id,
    x: isAttribute ? 0 : isMask ? activeMask.x + 80 : clamp(x, 0, activeMask.width - 40),
    y: isAttribute ? 0 : isMask ? activeMask.y + 80 : clamp(y, 0, activeMask.height - 30),
    width: isAttribute ? 0 : kind === 'output-string' ? 220 : isMask ? 800 : 130,
    height: isAttribute ? 0 : kind === 'output-string' ? 42 : isMask ? 600 : 90,
    backgroundColor: kind === 'output-string' || isAttribute ? 'transparent' : '#ffffff',
    borderColor: kind === 'output-string' || isAttribute ? 'transparent' : '#dfe6f0',
    text: kind === 'output-string' ? 'New Output String' : undefined,
    fontAttributeId: kind === 'output-string' ? current.objects.find((object) => object.kind === 'font-attribute')?.id : undefined,
    stringVariableId: kind === 'output-string' ? '' : undefined,
    horizontalAlign: kind === 'output-string' ? 'left' : undefined,
    verticalAlign: kind === 'output-string' ? 'top' : undefined,
    visible: true,
    locked: isMask ? false : undefined,
    childObjectIds: isMask ? [] : undefined,
    softKeyMaskId: isMask ? '' : undefined,
    nextMaskId: isMask ? '' : undefined,
    previousMaskId: isMask ? '' : undefined,
    hidden: kind === 'rectangle' ? false : undefined,
    lineAttributeId: kind === 'rectangle' ? current.objects.find((object) => object.kind === 'line-attribute')?.id : undefined,
    fillAttributeId: kind === 'rectangle' ? current.objects.find((object) => object.kind === 'fill-attribute')?.id : undefined,
    lineColor: kind === 'line-attribute' ? 0 : undefined,
    lineWidth: kind === 'line-attribute' ? 1 : undefined,
    lineArt: kind === 'line-attribute' ? '0xFFFF' : undefined,
    fillType: kind === 'fill-attribute' ? 'solid' : undefined,
    fillColor: kind === 'fill-attribute' ? 15 : undefined,
    fontColor: kind === 'font-attribute' ? 0 : undefined,
    proportional: kind === 'font-attribute' ? true : undefined,
    fontWidth: kind === 'font-attribute' ? 16 : undefined,
    fontHeight: kind === 'font-attribute' ? 24 : undefined,
    fontSize: kind === 'font-attribute' ? 24 : kind === 'output-string' ? 22 : undefined,
    fontType: kind === 'font-attribute' ? 1 : undefined,
    fontStyle: kind === 'font-attribute' ? 0 : undefined,
    stringValue: kind === 'string-variable' ? 'Dynamic text' : undefined,
    zIndex: current.objects.length + 1,
  };
}

export function referencePatch(kind: ReferenceKind, id: string) {
  if (kind === 'line-attribute') return { lineAttributeId: id };
  if (kind === 'fill-attribute') return { fillAttributeId: id };
  if (kind === 'font-attribute') return { fontAttributeId: id };
  return { stringVariableId: id };
}
